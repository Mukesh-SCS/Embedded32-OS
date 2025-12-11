/**
 * NanoProto - Lightweight Schema Encoding (Protobuf-Lite)
 * Minimal binary encoding for J1939 messages over Ethernet/MQTT
 */

export enum FieldType {
  VARINT = 0,
  FIXED64 = 1,
  DELIMITED = 2,
  FIXED32 = 5,
}

export interface NanoField {
  number: number;
  type: FieldType;
  name: string;
  value?: any;
}

export interface NanoSchema {
  name: string;
  fields: NanoField[];
}

/**
 * Simple variable-length integer encoding (protobuf style)
 */
export function encodeVarint(value: number): Buffer {
  const bytes: number[] = [];
  while (value > 127) {
    bytes.push((value & 0x7f) | 0x80);
    value >>>= 7;
  }
  bytes.push(value & 0x7f);
  return Buffer.from(bytes);
}

export function decodeVarint(buffer: Buffer, offset: number): [number, number] {
  let value = 0;
  let shift = 0;
  let i = offset;

  while (i < buffer.length) {
    const byte = buffer[i];
    value |= (byte & 0x7f) << shift;
    i++;
    if ((byte & 0x80) === 0) break;
    shift += 7;
  }

  return [value, i - offset];
}

/**
 * NanoProto Message Encoder
 */
export class NanoProtoEncoder {
  private buffer: Buffer[] = [];

  writeField(fieldNumber: number, type: FieldType, value: any): void {
    // Write field header (field_number << 3 | wire_type)
    const header = (fieldNumber << 3) | type;
    this.buffer.push(encodeVarint(header));

    switch (type) {
      case FieldType.VARINT:
        this.buffer.push(encodeVarint(value));
        break;
      case FieldType.FIXED32:
        const buf32 = Buffer.alloc(4);
        buf32.writeUInt32LE(value, 0);
        this.buffer.push(buf32);
        break;
      case FieldType.FIXED64:
        const buf64 = Buffer.alloc(8);
        buf64.writeUInt32LE(value & 0xffffffff, 0);
        buf64.writeUInt32LE((value / 0x100000000) & 0xffffffff, 4);
        this.buffer.push(buf64);
        break;
      case FieldType.DELIMITED:
        const data = Buffer.isBuffer(value) ? value : Buffer.from(value);
        this.buffer.push(encodeVarint(data.length));
        this.buffer.push(data);
        break;
    }
  }

  toBuffer(): Buffer {
    return Buffer.concat(this.buffer);
  }
}

/**
 * NanoProto Message Decoder
 */
export class NanoProtoDecoder {
  private offset: number = 0;

  constructor(private buffer: Buffer) {}

  readField(): [number, FieldType, any] | null {
    if (this.offset >= this.buffer.length) return null;

    const [header, headerSize] = decodeVarint(this.buffer, this.offset);
    this.offset += headerSize;

    const fieldNumber = header >> 3;
    const wireType = header & 0x7;

    let value: any;

    switch (wireType) {
      case FieldType.VARINT: {
        const [val, size] = decodeVarint(this.buffer, this.offset);
        value = val;
        this.offset += size;
        break;
      }
      case FieldType.FIXED32: {
        value = this.buffer.readUInt32LE(this.offset);
        this.offset += 4;
        break;
      }
      case FieldType.FIXED64: {
        const lo = this.buffer.readUInt32LE(this.offset);
        const hi = this.buffer.readUInt32LE(this.offset + 4);
        value = hi * 0x100000000 + lo;
        this.offset += 8;
        break;
      }
      case FieldType.DELIMITED: {
        const [len, lenSize] = decodeVarint(this.buffer, this.offset);
        this.offset += lenSize;
        value = this.buffer.slice(this.offset, this.offset + len);
        this.offset += len;
        break;
      }
    }

    return [fieldNumber, wireType, value];
  }

  remainingBytes(): number {
    return this.buffer.length - this.offset;
  }
}

/**
 * Compact J1939 Message encoding for Ethernet/MQTT
 */
export class J1939NanoProto {
  static encode(j1939Message: any): Buffer {
    const encoder = new NanoProtoEncoder();

    // Field 1: PGN (uint32)
    encoder.writeField(1, FieldType.VARINT, j1939Message.pgn);

    // Field 2: Source Address (uint32)
    encoder.writeField(2, FieldType.VARINT, j1939Message.sa);

    // Field 3: Priority (uint32)
    encoder.writeField(3, FieldType.VARINT, j1939Message.priority || 6);

    // Field 4: Data bytes (delimited)
    encoder.writeField(4, FieldType.DELIMITED, j1939Message.data);

    // Field 5: Timestamp (uint32 - seconds since epoch)
    encoder.writeField(5, FieldType.FIXED32, Math.floor(Date.now() / 1000));

    return encoder.toBuffer();
  }

  static decode(buffer: Buffer): any {
    const decoder = new NanoProtoDecoder(buffer);
    const message: any = { data: Buffer.alloc(0) };

    let field;
    while ((field = decoder.readField())) {
      const [fieldNumber, wireType, value] = field;

      switch (fieldNumber) {
        case 1:
          message.pgn = value;
          break;
        case 2:
          message.sa = value;
          break;
        case 3:
          message.priority = value;
          break;
        case 4:
          message.data = value;
          break;
        case 5:
          message.timestamp = value;
          break;
      }
    }

    return message;
  }
}

export default {
  NanoProtoEncoder,
  NanoProtoDecoder,
  J1939NanoProto,
  encodeVarint,
  decodeVarint,
  FieldType,
};

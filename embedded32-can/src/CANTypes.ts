export interface CANFrame {
  id: number;          // 11-bit or 29-bit CAN ID
  data: number[];      // 0-8 bytes
  extended?: boolean;  // 29-bit = true, 11-bit = false
  timestamp?: number;  // ms since epoch
}

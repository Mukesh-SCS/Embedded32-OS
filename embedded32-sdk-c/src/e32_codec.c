/**
 * @file e32_codec.c
 * @brief Embedded32 SDK - J1939 Codec Implementation
 * 
 * Encoding and decoding logic for J1939 messages.
 * 
 * @version 1.0.0
 */

#include "e32_codec.h"
#include <string.h>

/* ==========================================================================
 * PGN DATABASE
 * ========================================================================== */

typedef struct {
    uint32_t    pgn;
    const char* name;
    uint8_t     length;
} pgn_entry_t;

static const pgn_entry_t PGN_DATABASE[] = {
    { 0x00EA00, "Request", 3 },
    { 0x00EE00, "Address Claimed", 8 },
    { 0x00F004, "Electronic Engine Controller 1 (EEC1)", 8 },
    { 0x00F003, "Electronic Transmission Controller 1 (ETC1)", 8 },
    { 0x00F000, "Proprietary Transmission Status", 8 },
    { 0x00FEEE, "Engine Temperature 1 (ET1)", 8 },
    { 0x00FEF2, "Fuel Economy (FE)", 8 },
    { 0x00FECA, "DM1 - Active Diagnostic Trouble Codes", 8 },
    { 0x00FECB, "DM2 - Previously Active DTCs", 8 },
    { 0x00EF00, "Engine Control Command (Proprietary B)", 8 },
    { 0, NULL, 0 }  /* Sentinel */
};

/* ==========================================================================
 * J1939 ID PARSING
 * ========================================================================== */

void e32_parse_j1939_id(uint32_t can_id, e32_j1939_id_t* parsed)
{
    if (!parsed) return;
    
    /*
     * J1939 29-bit ID format:
     * Bits 28-26: Priority (3 bits)
     * Bits 25-24: Reserved/EDP/DP (2 bits)
     * Bits 23-16: PF (PDU Format, 8 bits)
     * Bits 15-8:  PS (PDU Specific, 8 bits)
     * Bits 7-0:   SA (Source Address, 8 bits)
     */
    
    parsed->priority = (can_id >> 26) & 0x07;
    uint8_t pf = (can_id >> 16) & 0xFF;
    uint8_t ps = (can_id >> 8) & 0xFF;
    parsed->source_address = can_id & 0xFF;
    
    if (pf < 240) {
        /* PDU1 format - destination specific */
        parsed->pgn = (uint32_t)pf << 8;
        parsed->destination_address = ps;
        parsed->pdu1 = true;
    } else {
        /* PDU2 format - broadcast */
        parsed->pgn = ((uint32_t)pf << 8) | ps;
        parsed->destination_address = 0xFF;
        parsed->pdu1 = false;
    }
}

uint32_t e32_build_j1939_id(
    uint32_t pgn,
    uint8_t source_address,
    uint8_t priority,
    uint8_t destination
)
{
    uint8_t pf = (pgn >> 8) & 0xFF;
    uint8_t ps = pgn & 0xFF;
    
    uint32_t can_id = ((uint32_t)(priority & 0x07)) << 26;
    can_id |= ((uint32_t)pf << 16);
    
    if (pf < 240) {
        /* PDU1 - use destination address as PS */
        can_id |= ((uint32_t)destination << 8);
    } else {
        /* PDU2 - use PS from PGN */
        can_id |= ((uint32_t)ps << 8);
    }
    
    can_id |= source_address;
    
    return can_id;
}

/* ==========================================================================
 * PGN NAME LOOKUP
 * ========================================================================== */

const char* e32_get_pgn_name(uint32_t pgn)
{
    for (const pgn_entry_t* entry = PGN_DATABASE; entry->name != NULL; entry++) {
        if (entry->pgn == pgn) {
            return entry->name;
        }
    }
    return "Unknown";
}

/* ==========================================================================
 * SPN DECODING HELPERS
 * ========================================================================== */

static void add_spn_float(e32_j1939_message_t* msg, const char* name, float value)
{
    if (msg->spn_count < E32_MAX_SPNS) {
        msg->spns[msg->spn_count].name = name;
        msg->spns[msg->spn_count].value.f32 = value;
        msg->spns[msg->spn_count].type = E32_SPN_TYPE_FLOAT;
        msg->spn_count++;
    }
}

static void add_spn_int(e32_j1939_message_t* msg, const char* name, int32_t value)
{
    if (msg->spn_count < E32_MAX_SPNS) {
        msg->spns[msg->spn_count].name = name;
        msg->spns[msg->spn_count].value.i32 = value;
        msg->spns[msg->spn_count].type = E32_SPN_TYPE_INT;
        msg->spn_count++;
    }
}

static void add_spn_bool(e32_j1939_message_t* msg, const char* name, bool value)
{
    if (msg->spn_count < E32_MAX_SPNS) {
        msg->spns[msg->spn_count].name = name;
        msg->spns[msg->spn_count].value.boolean = value;
        msg->spns[msg->spn_count].type = E32_SPN_TYPE_BOOL;
        msg->spn_count++;
    }
}

/* ==========================================================================
 * FRAME DECODING
 * ========================================================================== */

e32_error_t e32_decode_frame(
    const e32_can_frame_t* frame,
    e32_j1939_message_t* message
)
{
    if (!frame || !message) {
        return E32_ERR_INVALID_PARAM;
    }
    
    /* Clear output */
    memset(message, 0, sizeof(*message));
    
    /* Parse CAN ID */
    e32_j1939_id_t parsed;
    e32_parse_j1939_id(frame->id, &parsed);
    
    message->pgn = parsed.pgn;
    message->pgn_name = e32_get_pgn_name(parsed.pgn);
    message->source_address = parsed.source_address;
    message->destination_address = parsed.destination_address;
    message->priority = parsed.priority;
    message->timestamp = frame->timestamp;
    
    /* Copy raw data */
    message->raw_len = frame->dlc;
    memcpy(message->raw, frame->data, frame->dlc);
    
    /* Decode SPNs based on PGN */
    const uint8_t* data = frame->data;
    uint8_t len = frame->dlc;
    
    switch (parsed.pgn) {
        case E32_PGN_EEC1:  /* 0xF004 - Electronic Engine Controller 1 */
            if (len >= 5) {
                uint16_t raw_speed = data[3] | ((uint16_t)data[4] << 8);
                add_spn_float(message, "engineSpeed", raw_speed * 0.125f);
            }
            if (len >= 3) {
                add_spn_int(message, "torque", (int32_t)data[2] - 125);
            }
            break;
            
        case E32_PGN_ET1:  /* 0xFEEE - Engine Temperature 1 */
            if (len >= 1) {
                add_spn_int(message, "coolantTemp", (int32_t)data[0] - 40);
            }
            break;
            
        case E32_PGN_ETC1:  /* 0xF003 */
        case E32_PGN_PROP_TRANS_STATUS:  /* 0xF000 */
            if (len >= 2) {
                uint16_t raw_speed = data[0] | ((uint16_t)data[1] << 8);
                add_spn_float(message, "outputShaftSpeed", raw_speed * 0.125f);
            }
            if (len >= 5) {
                add_spn_int(message, "gear", data[4]);
            }
            break;
            
        case E32_PGN_REQUEST:  /* 0xEA00 */
            if (len >= 3) {
                uint32_t req_pgn = data[0] | ((uint32_t)data[1] << 8) | ((uint32_t)data[2] << 16);
                add_spn_int(message, "requestedPGN", (int32_t)req_pgn);
            }
            break;
            
        case E32_PGN_ENGINE_CONTROL_CMD:  /* 0xEF00 */
            if (len >= 3) {
                add_spn_int(message, "targetRpm", data[0] | ((uint16_t)data[1] << 8));
                add_spn_bool(message, "enable", data[2] == 1);
            }
            break;
            
        case E32_PGN_DM1:  /* 0xFECA */
            if (len >= 5) {
                add_spn_int(message, "lampStatus", data[0]);
                uint32_t spn = data[2] | ((uint32_t)data[3] << 8) | (((uint32_t)(data[4] & 0xE0)) << 11);
                add_spn_int(message, "spn", (int32_t)spn);
                add_spn_int(message, "fmi", data[4] & 0x1F);
            }
            break;
            
        default:
            /* Unknown PGN - no SPN decoding */
            break;
    }
    
    return E32_OK;
}

/* ==========================================================================
 * FRAME ENCODING
 * ========================================================================== */

void e32_encode_request(
    uint32_t requested_pgn,
    uint8_t source_address,
    uint8_t destination,
    e32_can_frame_t* frame
)
{
    if (!frame) return;
    
    memset(frame, 0, sizeof(*frame));
    
    frame->id = e32_build_j1939_id(E32_PGN_REQUEST, source_address, 6, destination);
    frame->dlc = 3;
    frame->is_extended = true;
    
    frame->data[0] = requested_pgn & 0xFF;
    frame->data[1] = (requested_pgn >> 8) & 0xFF;
    frame->data[2] = (requested_pgn >> 16) & 0xFF;
}

void e32_encode_engine_control(
    const e32_engine_control_cmd_t* cmd,
    uint8_t source_address,
    e32_can_frame_t* frame
)
{
    if (!cmd || !frame) return;
    
    memset(frame, 0, sizeof(*frame));
    
    frame->id = e32_build_j1939_id(E32_PGN_ENGINE_CONTROL_CMD, source_address, 6, E32_SA_GLOBAL);
    frame->dlc = 8;
    frame->is_extended = true;
    
    frame->data[0] = cmd->target_rpm & 0xFF;
    frame->data[1] = (cmd->target_rpm >> 8) & 0xFF;
    frame->data[2] = cmd->enable ? 1 : 0;
    frame->data[3] = cmd->fault_flags;  /* Fault injection flags */
    frame->data[4] = 0xFF;  /* Reserved */
    frame->data[5] = 0xFF;
    frame->data[6] = 0xFF;
    frame->data[7] = 0xFF;
}

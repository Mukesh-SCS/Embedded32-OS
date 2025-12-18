/**
 * @file e32_codec.h
 * @brief Embedded32 SDK - J1939 Encoding/Decoding
 * 
 * Low-level codec functions for J1939 protocol.
 * 
 * @version 1.0.0
 */

#ifndef E32_CODEC_H
#define E32_CODEC_H

#include "e32_types.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ==========================================================================
 * J1939 ID PARSING
 * ========================================================================== */

/**
 * @brief Parsed J1939 CAN ID components
 */
typedef struct {
    uint8_t  priority;              /**< Priority (0-7) */
    uint32_t pgn;                   /**< Parameter Group Number */
    uint8_t  source_address;        /**< Source Address */
    uint8_t  destination_address;   /**< Destination Address */
    bool     pdu1;                  /**< True if PDU1 format */
} e32_j1939_id_t;

/**
 * @brief Parse a J1939 extended CAN ID
 * 
 * @param can_id 29-bit CAN ID
 * @param parsed Output structure
 */
void e32_parse_j1939_id(uint32_t can_id, e32_j1939_id_t* parsed);

/**
 * @brief Build a J1939 extended CAN ID
 * 
 * @param pgn Parameter Group Number
 * @param source_address Source Address
 * @param priority Priority (0-7)
 * @param destination Destination Address
 * @return 29-bit CAN ID
 */
uint32_t e32_build_j1939_id(
    uint32_t pgn,
    uint8_t source_address,
    uint8_t priority,
    uint8_t destination
);


/* ==========================================================================
 * PGN NAME LOOKUP
 * ========================================================================== */

/**
 * @brief Get PGN name from database
 * 
 * @param pgn Parameter Group Number
 * @return PGN name string (static, do not free)
 */
const char* e32_get_pgn_name(uint32_t pgn);


/* ==========================================================================
 * FRAME DECODING
 * ========================================================================== */

/**
 * @brief Decode a CAN frame to J1939 message
 * 
 * @param frame Input CAN frame
 * @param message Output decoded message
 * @return E32_OK on success, error code otherwise
 */
e32_error_t e32_decode_frame(
    const e32_can_frame_t* frame,
    e32_j1939_message_t* message
);


/* ==========================================================================
 * FRAME ENCODING
 * ========================================================================== */

/**
 * @brief Encode Request PGN frame
 * 
 * @param requested_pgn PGN to request
 * @param source_address Sender's SA
 * @param destination Target SA
 * @param frame Output CAN frame
 */
void e32_encode_request(
    uint32_t requested_pgn,
    uint8_t source_address,
    uint8_t destination,
    e32_can_frame_t* frame
);

/**
 * @brief Encode Engine Control Command frame
 * 
 * @param cmd Command data
 * @param source_address Sender's SA
 * @param frame Output CAN frame
 */
void e32_encode_engine_control(
    const e32_engine_control_cmd_t* cmd,
    uint8_t source_address,
    e32_can_frame_t* frame
);


#ifdef __cplusplus
}
#endif

#endif /* E32_CODEC_H */

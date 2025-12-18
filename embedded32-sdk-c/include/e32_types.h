/**
 * @file e32_types.h
 * @brief Embedded32 SDK - Core Type Definitions
 * 
 * This file defines the unified SDK API types.
 * All SDKs (C, JS, Python) share the same conceptual API.
 * 
 * @version 1.0.0
 */

#ifndef E32_TYPES_H
#define E32_TYPES_H

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ==========================================================================
 * WELL-KNOWN PGNs
 * ========================================================================== */

/** Request PGN (59904) - used to request data from other ECUs */
#define E32_PGN_REQUEST             0xEA00

/** Address Claimed (60928) */
#define E32_PGN_ADDRESS_CLAIMED     0xEE00

/** Electronic Engine Controller 1 (61444) */
#define E32_PGN_EEC1                0xF004

/** Electronic Transmission Controller 1 (61443) */
#define E32_PGN_ETC1                0xF003

/** Proprietary Transmission Status (61440) */
#define E32_PGN_PROP_TRANS_STATUS   0xF000

/** Engine Temperature 1 (65262) */
#define E32_PGN_ET1                 0xFEEE

/** Fuel Economy (65266) */
#define E32_PGN_FE                  0xFEF2

/** DM1 Active Diagnostic Trouble Codes (65226) */
#define E32_PGN_DM1                 0xFECA

/** DM2 Previously Active DTCs (65227) */
#define E32_PGN_DM2                 0xFECB

/** Engine Control Command - Proprietary B (61184) */
#define E32_PGN_ENGINE_CONTROL_CMD  0xEF00


/* ==========================================================================
 * WELL-KNOWN SOURCE ADDRESSES
 * ========================================================================== */

/** Engine ECU #1 */
#define E32_SA_ENGINE_1             0x00

/** Engine ECU #2 */
#define E32_SA_ENGINE_2             0x01

/** Transmission ECU #1 */
#define E32_SA_TRANSMISSION_1       0x03

/** Brakes - System Controller */
#define E32_SA_BRAKES               0x0B

/** Body Controller */
#define E32_SA_BODY                 0x21

/** Instrument Cluster */
#define E32_SA_INSTRUMENT_CLUSTER   0x17

/** Off-board Diagnostic Tool #1 */
#define E32_SA_DIAG_TOOL_1          0xF9

/** Off-board Diagnostic Tool #2 */
#define E32_SA_DIAG_TOOL_2          0xFA

/** Global (broadcast) */
#define E32_SA_GLOBAL               0xFF


/* ==========================================================================
 * CAN FRAME TYPES
 * ========================================================================== */

/** Maximum CAN data length */
#define E32_CAN_MAX_DATA_LEN        8

/**
 * @brief Raw CAN frame structure
 */
typedef struct {
    uint32_t id;                        /**< CAN ID (29-bit for J1939) */
    uint8_t  data[E32_CAN_MAX_DATA_LEN]; /**< Frame data */
    uint8_t  dlc;                       /**< Data length code (0-8) */
    uint32_t timestamp;                 /**< Timestamp in milliseconds */
    bool     is_extended;               /**< True for 29-bit extended ID */
} e32_can_frame_t;


/* ==========================================================================
 * J1939 MESSAGE TYPES
 * ========================================================================== */

/** Maximum number of SPNs in a decoded message */
#define E32_MAX_SPNS                8

/**
 * @brief SPN value union for different types
 */
typedef union {
    int32_t  i32;       /**< Integer value */
    float    f32;       /**< Float value */
    bool     boolean;   /**< Boolean value */
} e32_spn_value_t;

/**
 * @brief SPN type enumeration
 */
typedef enum {
    E32_SPN_TYPE_INT,
    E32_SPN_TYPE_FLOAT,
    E32_SPN_TYPE_BOOL
} e32_spn_type_t;

/**
 * @brief Single SPN (Signal/Parameter Number) entry
 */
typedef struct {
    const char*     name;   /**< SPN name (e.g., "engineSpeed") */
    e32_spn_value_t value;  /**< Decoded value */
    e32_spn_type_t  type;   /**< Value type */
} e32_spn_t;

/**
 * @brief Decoded J1939 message - what the user receives
 */
typedef struct {
    uint32_t    pgn;                    /**< Parameter Group Number */
    const char* pgn_name;               /**< PGN name from database */
    uint8_t     source_address;         /**< Source Address of sender */
    uint8_t     destination_address;    /**< Destination Address (255 for broadcast) */
    uint8_t     priority;               /**< Priority (0-7) */
    e32_spn_t   spns[E32_MAX_SPNS];     /**< Decoded SPNs */
    uint8_t     spn_count;              /**< Number of valid SPNs */
    uint8_t     raw[E32_CAN_MAX_DATA_LEN]; /**< Raw data bytes */
    uint8_t     raw_len;                /**< Raw data length */
    uint32_t    timestamp;              /**< Timestamp in milliseconds */
} e32_j1939_message_t;


/* ==========================================================================
 * CLIENT CONFIGURATION
 * ========================================================================== */

/**
 * @brief Transport type enumeration
 */
typedef enum {
    E32_TRANSPORT_AUTO,         /**< Auto-detect transport */
    E32_TRANSPORT_SOCKETCAN,    /**< Linux SocketCAN */
    E32_TRANSPORT_STM32_BXCAN,  /**< STM32 bxCAN */
    E32_TRANSPORT_ESP32_TWAI,   /**< ESP32 TWAI */
    E32_TRANSPORT_VIRTUAL       /**< Virtual (testing) */
} e32_transport_type_t;

/**
 * @brief J1939 Client configuration
 */
typedef struct {
    const char*         interface_name;  /**< CAN interface (e.g., "can0") */
    uint8_t             source_address;  /**< This client's SA (0x00-0xFD) */
    e32_transport_type_t transport;      /**< Transport type */
    uint32_t            bitrate;         /**< CAN bitrate (default: 250000) */
    bool                debug;           /**< Enable debug output */
} e32_j1939_config_t;


/* ==========================================================================
 * ENGINE CONTROL COMMAND DATA
 * ========================================================================== */

/**
 * @brief Fault injection flags for ENGINE_CONTROL_CMD
 */
#define E32_FAULT_NONE      0x00    /**< No fault */
#define E32_FAULT_OVERHEAT  0x01    /**< Simulate engine overheat */

/**
 * @brief Engine Control Command data (PGN 0xEF00)
 */
typedef struct {
    uint16_t target_rpm;    /**< Target engine RPM */
    bool     enable;        /**< Enable flag (true = apply command) */
    uint8_t  fault_flags;   /**< Fault injection flags (E32_FAULT_*) */
} e32_engine_control_cmd_t;


/* ==========================================================================
 * CALLBACK TYPES
 * ========================================================================== */

/**
 * @brief Callback for receiving J1939 messages
 * 
 * @param message Pointer to decoded message
 * @param user_data User-provided context pointer
 */
typedef void (*e32_pgn_handler_t)(const e32_j1939_message_t* message, void* user_data);


/* ==========================================================================
 * ERROR CODES
 * ========================================================================== */

typedef enum {
    E32_OK = 0,                     /**< Success */
    E32_ERR_INVALID_PARAM = -1,     /**< Invalid parameter */
    E32_ERR_NOT_CONNECTED = -2,     /**< Not connected */
    E32_ERR_ALREADY_CONNECTED = -3, /**< Already connected */
    E32_ERR_TRANSPORT = -4,         /**< Transport error */
    E32_ERR_NO_MEMORY = -5,         /**< Out of memory */
    E32_ERR_TIMEOUT = -6,           /**< Operation timed out */
    E32_ERR_NOT_SUPPORTED = -7      /**< Not supported on this platform */
} e32_error_t;


#ifdef __cplusplus
}
#endif

#endif /* E32_TYPES_H */

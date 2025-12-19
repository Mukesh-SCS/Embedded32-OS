/**
 * @file e32_j1939.h
 * @brief Embedded32 SDK - J1939 Client API
 * 
 * The main SDK interface for interacting with J1939 networks.
 * This mirrors the JS and Python SDK APIs.
 * 
 * @version 1.0.0
 */

#ifndef E32_J1939_H
#define E32_J1939_H

#include "e32_types.h"

#ifdef __cplusplus
extern "C" {
#endif

/* ==========================================================================
 * J1939 CLIENT HANDLE
 * ========================================================================== */

/**
 * @brief Opaque handle to J1939 client instance
 */
typedef struct e32_j1939_client* e32_j1939_client_t;


/* ==========================================================================
 * CLIENT LIFECYCLE
 * ========================================================================== */

/**
 * @brief Create a new J1939 client
 * 
 * @param config Client configuration
 * @param client_out Pointer to receive client handle
 * @return E32_OK on success, error code otherwise
 * 
 * @example
 * @code
 * e32_j1939_config_t config = {
 *     .interface_name = "can0",
 *     .source_address = E32_SA_DIAG_TOOL_2,
 *     .transport = E32_TRANSPORT_AUTO,
 *     .bitrate = 250000,
 *     .debug = false
 * };
 * 
 * e32_j1939_client_t client;
 * e32_error_t err = e32_j1939_create(&config, &client);
 * @endcode
 */
e32_error_t e32_j1939_create(const e32_j1939_config_t* config, e32_j1939_client_t* client_out);

/**
 * @brief Destroy a J1939 client and free resources
 * 
 * @param client Client handle
 */
void e32_j1939_destroy(e32_j1939_client_t client);

/**
 * @brief Connect to the J1939 network
 * 
 * Must be called before any other operations.
 * 
 * @param client Client handle
 * @return E32_OK on success, error code otherwise
 */
e32_error_t e32_j1939_connect(e32_j1939_client_t client);

/**
 * @brief Disconnect from the J1939 network
 * 
 * @param client Client handle
 * @return E32_OK on success, error code otherwise
 */
e32_error_t e32_j1939_disconnect(e32_j1939_client_t client);

/**
 * @brief Check if client is connected
 * 
 * @param client Client handle
 * @return true if connected, false otherwise
 */
bool e32_j1939_is_connected(e32_j1939_client_t client);

/**
 * @brief Get client's source address
 * 
 * @param client Client handle
 * @return Source address (0x00-0xFD)
 */
uint8_t e32_j1939_get_source_address(e32_j1939_client_t client);


/* ==========================================================================
 * PGN SUBSCRIPTION
 * ========================================================================== */

/**
 * @brief Subscribe to a specific PGN
 * 
 * Handler is called whenever a message with this PGN is received.
 * 
 * @param client Client handle
 * @param pgn Parameter Group Number to subscribe to
 * @param handler Callback function
 * @param user_data User context passed to callback
 * @return E32_OK on success, error code otherwise
 * 
 * @example
 * @code
 * void on_engine_data(const e32_j1939_message_t* msg, void* ctx) {
 *     for (int i = 0; i < msg->spn_count; i++) {
 *         if (strcmp(msg->spns[i].name, "engineSpeed") == 0) {
 *             printf("Engine Speed: %.1f RPM\n", msg->spns[i].value.f32);
 *         }
 *     }
 * }
 * 
 * e32_j1939_on_pgn(client, E32_PGN_EEC1, on_engine_data, NULL);
 * @endcode
 */
e32_error_t e32_j1939_on_pgn(
    e32_j1939_client_t client,
    uint32_t pgn,
    e32_pgn_handler_t handler,
    void* user_data
);

/**
 * @brief Unsubscribe from a PGN
 * 
 * @param client Client handle
 * @param pgn Parameter Group Number to unsubscribe from
 * @return E32_OK on success, error code otherwise
 */
e32_error_t e32_j1939_off_pgn(e32_j1939_client_t client, uint32_t pgn);


/* ==========================================================================
 * PGN REQUESTS
 * ========================================================================== */

/**
 * @brief Request a PGN from the network
 * 
 * Sends Request PGN (59904/0xEA00) asking for data.
 * The response will arrive via the on_pgn handler.
 * 
 * @param client Client handle
 * @param pgn Parameter Group Number to request
 * @param destination Target address (E32_SA_GLOBAL for broadcast)
 * @return E32_OK on success, error code otherwise
 * 
 * @example
 * @code
 * // Request engine temperature from all ECUs
 * e32_j1939_request_pgn(client, E32_PGN_ET1, E32_SA_GLOBAL);
 * 
 * // Request from specific ECU
 * e32_j1939_request_pgn(client, E32_PGN_EEC1, E32_SA_ENGINE_1);
 * @endcode
 */
e32_error_t e32_j1939_request_pgn(
    e32_j1939_client_t client,
    uint32_t pgn,
    uint8_t destination
);


/* ==========================================================================
 * INTERNAL/ADVANCED API (NOT PART OF PUBLIC CONTRACT)
 * ========================================================================== */

/**
 * @brief Send raw PGN data
 * 
 * @warning INTERNAL API - Not part of the stable public API.
 *          This function may change or be removed without notice.
 *          Use e32_j1939_send_engine_control() for normal usage.
 * 
 * @param client Client handle
 * @param pgn Parameter Group Number
 * @param data Raw data bytes
 * @param len Data length (1-8)
 * @param destination Target address
 * @param priority Message priority (0-7, default 6)
 * @return E32_OK on success, error code otherwise
 * 
 * @internal
 */
e32_error_t e32_j1939_send_raw(
    e32_j1939_client_t client,
    uint32_t pgn,
    const uint8_t* data,
    uint8_t len,
    uint8_t destination,
    uint8_t priority
);


/* ==========================================================================
 * ENGINE CONTROL COMMAND (CONVENIENCE)
 * ========================================================================== */

/**
 * @brief Send Engine Control Command (PGN 0xEF00)
 * 
 * Convenience function for sending engine control commands.
 * 
 * @param client Client handle
 * @param cmd Command data
 * @return E32_OK on success, error code otherwise
 * 
 * @example
 * @code
 * e32_engine_control_cmd_t cmd = {
 *     .target_rpm = 1200,
 *     .enable = true
 * };
 * e32_j1939_send_engine_control(client, &cmd);
 * @endcode
 */
e32_error_t e32_j1939_send_engine_control(
    e32_j1939_client_t client,
    const e32_engine_control_cmd_t* cmd
);


/* ==========================================================================
 * POLLING (FOR NON-RTOS SYSTEMS)
 * ========================================================================== */

/**
 * @brief Process pending messages
 * 
 * Must be called periodically in main loop on non-RTOS systems.
 * On RTOS systems with dedicated receive task, this is optional.
 * 
 * @param client Client handle
 * @return Number of messages processed
 */
int e32_j1939_poll(e32_j1939_client_t client);


#ifdef __cplusplus
}
#endif

#endif /* E32_J1939_H */

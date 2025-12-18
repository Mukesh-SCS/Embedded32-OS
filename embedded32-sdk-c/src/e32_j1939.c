/**
 * @file e32_j1939.c
 * @brief Embedded32 SDK - J1939 Client Implementation
 * 
 * Main J1939 client implementation.
 * 
 * @version 1.0.0
 */

#include "e32_j1939.h"
#include "e32_codec.h"
#include <stdlib.h>
#include <string.h>

/* ==========================================================================
 * INTERNAL TYPES
 * ========================================================================== */

#define MAX_PGN_HANDLERS 16

typedef struct {
    uint32_t            pgn;
    e32_pgn_handler_t   handler;
    void*               user_data;
    bool                active;
} pgn_subscription_t;

struct e32_j1939_client {
    e32_j1939_config_t  config;
    bool                connected;
    pgn_subscription_t  subscriptions[MAX_PGN_HANDLERS];
    uint8_t             subscription_count;
    
    /* Platform-specific transport handle would go here */
    void*               transport_handle;
};

/* ==========================================================================
 * CLIENT LIFECYCLE
 * ========================================================================== */

e32_error_t e32_j1939_create(const e32_j1939_config_t* config, e32_j1939_client_t* client_out)
{
    if (!config || !client_out) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (config->source_address > 0xFD) {
        return E32_ERR_INVALID_PARAM;
    }
    
    struct e32_j1939_client* client = malloc(sizeof(struct e32_j1939_client));
    if (!client) {
        return E32_ERR_NO_MEMORY;
    }
    
    memset(client, 0, sizeof(*client));
    memcpy(&client->config, config, sizeof(e32_j1939_config_t));
    client->connected = false;
    
    *client_out = client;
    return E32_OK;
}

void e32_j1939_destroy(e32_j1939_client_t client)
{
    if (!client) return;
    
    if (client->connected) {
        e32_j1939_disconnect(client);
    }
    
    free(client);
}

e32_error_t e32_j1939_connect(e32_j1939_client_t client)
{
    if (!client) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (client->connected) {
        return E32_ERR_ALREADY_CONNECTED;
    }
    
    /* 
     * Platform-specific connection logic would go here.
     * For now, we just mark as connected.
     */
    
    client->connected = true;
    return E32_OK;
}

e32_error_t e32_j1939_disconnect(e32_j1939_client_t client)
{
    if (!client) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (!client->connected) {
        return E32_OK;  /* Already disconnected */
    }
    
    /*
     * Platform-specific disconnection logic would go here.
     */
    
    client->connected = false;
    client->subscription_count = 0;
    memset(client->subscriptions, 0, sizeof(client->subscriptions));
    
    return E32_OK;
}

bool e32_j1939_is_connected(e32_j1939_client_t client)
{
    if (!client) return false;
    return client->connected;
}

uint8_t e32_j1939_get_source_address(e32_j1939_client_t client)
{
    if (!client) return 0xFF;
    return client->config.source_address;
}

/* ==========================================================================
 * PGN SUBSCRIPTION
 * ========================================================================== */

e32_error_t e32_j1939_on_pgn(
    e32_j1939_client_t client,
    uint32_t pgn,
    e32_pgn_handler_t handler,
    void* user_data
)
{
    if (!client || !handler) {
        return E32_ERR_INVALID_PARAM;
    }
    
    /* Find free slot */
    for (int i = 0; i < MAX_PGN_HANDLERS; i++) {
        if (!client->subscriptions[i].active) {
            client->subscriptions[i].pgn = pgn;
            client->subscriptions[i].handler = handler;
            client->subscriptions[i].user_data = user_data;
            client->subscriptions[i].active = true;
            client->subscription_count++;
            return E32_OK;
        }
    }
    
    return E32_ERR_NO_MEMORY;
}

e32_error_t e32_j1939_off_pgn(e32_j1939_client_t client, uint32_t pgn)
{
    if (!client) {
        return E32_ERR_INVALID_PARAM;
    }
    
    for (int i = 0; i < MAX_PGN_HANDLERS; i++) {
        if (client->subscriptions[i].active && client->subscriptions[i].pgn == pgn) {
            client->subscriptions[i].active = false;
            client->subscription_count--;
            return E32_OK;
        }
    }
    
    return E32_OK;  /* Not found is not an error */
}

/* ==========================================================================
 * PGN REQUESTS
 * ========================================================================== */

e32_error_t e32_j1939_request_pgn(
    e32_j1939_client_t client,
    uint32_t pgn,
    uint8_t destination
)
{
    if (!client) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (!client->connected) {
        return E32_ERR_NOT_CONNECTED;
    }
    
    e32_can_frame_t frame;
    e32_encode_request(pgn, client->config.source_address, destination, &frame);
    
    /*
     * Platform-specific send logic would go here.
     * e.g., can_send(client->transport_handle, &frame);
     */
    
    return E32_OK;
}

/* ==========================================================================
 * PGN SENDING
 * ========================================================================== */

e32_error_t e32_j1939_send_raw(
    e32_j1939_client_t client,
    uint32_t pgn,
    const uint8_t* data,
    uint8_t len,
    uint8_t destination,
    uint8_t priority
)
{
    if (!client || !data || len == 0 || len > 8) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (!client->connected) {
        return E32_ERR_NOT_CONNECTED;
    }
    
    e32_can_frame_t frame;
    memset(&frame, 0, sizeof(frame));
    
    frame.id = e32_build_j1939_id(pgn, client->config.source_address, priority, destination);
    frame.dlc = len;
    frame.is_extended = true;
    memcpy(frame.data, data, len);
    
    /*
     * Platform-specific send logic would go here.
     */
    
    return E32_OK;
}

e32_error_t e32_j1939_send_engine_control(
    e32_j1939_client_t client,
    const e32_engine_control_cmd_t* cmd
)
{
    if (!client || !cmd) {
        return E32_ERR_INVALID_PARAM;
    }
    
    if (!client->connected) {
        return E32_ERR_NOT_CONNECTED;
    }
    
    e32_can_frame_t frame;
    e32_encode_engine_control(cmd, client->config.source_address, &frame);
    
    /*
     * Platform-specific send logic would go here.
     */
    
    return E32_OK;
}

/* ==========================================================================
 * POLLING
 * ========================================================================== */

int e32_j1939_poll(e32_j1939_client_t client)
{
    if (!client || !client->connected) {
        return 0;
    }
    
    int processed = 0;
    
    /*
     * Platform-specific receive logic would go here.
     * Example:
     * 
     * e32_can_frame_t frame;
     * while (can_receive(client->transport_handle, &frame, 0) == E32_OK) {
     *     e32_j1939_message_t message;
     *     if (e32_decode_frame(&frame, &message) == E32_OK) {
     *         // Dispatch to handlers
     *         for (int i = 0; i < MAX_PGN_HANDLERS; i++) {
     *             if (client->subscriptions[i].active &&
     *                 client->subscriptions[i].pgn == message.pgn) {
     *                 client->subscriptions[i].handler(
     *                     &message, client->subscriptions[i].user_data);
     *             }
     *         }
     *         processed++;
     *     }
     * }
     */
    
    return processed;
}

/* ==========================================================================
 * INTERNAL: FRAME DISPATCH
 * ========================================================================== */

/**
 * @brief Called by transport layer when a frame is received
 * 
 * This function is called by the platform-specific transport
 * when a CAN frame is received.
 */
void e32_j1939_dispatch_frame(e32_j1939_client_t client, const e32_can_frame_t* frame)
{
    if (!client || !frame) return;
    
    e32_j1939_message_t message;
    if (e32_decode_frame(frame, &message) != E32_OK) {
        return;
    }
    
    /* Dispatch to handlers */
    for (int i = 0; i < MAX_PGN_HANDLERS; i++) {
        if (client->subscriptions[i].active &&
            client->subscriptions[i].pgn == message.pgn) {
            client->subscriptions[i].handler(&message, client->subscriptions[i].user_data);
        }
    }
}

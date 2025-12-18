/**
 * @file engine_monitor.c
 * @brief Embedded32 SDK Example - Engine Monitor
 * 
 * Demonstrates how to use the C SDK to:
 * 1. Connect to a J1939 network
 * 2. Subscribe to engine data
 * 3. Request specific PGNs
 * 4. Send control commands
 * 
 * Compile: gcc -I../include -o engine_monitor engine_monitor.c ../src/*.c
 */

#include "embedded32.h"
#include <stdio.h>
#include <stdbool.h>

/* Engine state tracking */
static struct {
    float rpm;
    int32_t torque;
    int32_t coolant_temp;
    int message_count;
} engine_state = {0};

/**
 * Handler for EEC1 messages (Engine Controller)
 */
void on_engine_controller(const e32_j1939_message_t* msg, void* ctx)
{
    (void)ctx;  /* Unused */
    
    for (int i = 0; i < msg->spn_count; i++) {
        if (msg->spns[i].type == E32_SPN_TYPE_FLOAT) {
            if (strcmp(msg->spns[i].name, "engineSpeed") == 0) {
                engine_state.rpm = msg->spns[i].value.f32;
            }
        } else if (msg->spns[i].type == E32_SPN_TYPE_INT) {
            if (strcmp(msg->spns[i].name, "torque") == 0) {
                engine_state.torque = msg->spns[i].value.i32;
            }
        }
    }
    
    engine_state.message_count++;
    printf("Engine: %.1f RPM, %d%% torque\n", engine_state.rpm, engine_state.torque);
}

/**
 * Handler for ET1 messages (Engine Temperature)
 */
void on_engine_temperature(const e32_j1939_message_t* msg, void* ctx)
{
    (void)ctx;
    
    for (int i = 0; i < msg->spn_count; i++) {
        if (msg->spns[i].type == E32_SPN_TYPE_INT &&
            strcmp(msg->spns[i].name, "coolantTemp") == 0) {
            engine_state.coolant_temp = msg->spns[i].value.i32;
            printf("Coolant: %d°C\n", engine_state.coolant_temp);
        }
    }
}

int main(void)
{
    printf("======================================\n");
    printf("  Embedded32 SDK - Engine Monitor\n");
    printf("======================================\n\n");
    
    /* Initialize SDK */
    e32_error_t err = e32_init();
    if (err != E32_OK) {
        printf("Failed to initialize SDK: %d\n", err);
        return 1;
    }
    
    printf("SDK Version: %s\n\n", e32_get_version());
    
    /* Create client configuration */
    e32_j1939_config_t config = {
        .interface_name = "can0",
        .source_address = E32_SA_DIAG_TOOL_2,
        .transport = E32_TRANSPORT_AUTO,
        .bitrate = 250000,
        .debug = false
    };
    
    /* Create client */
    e32_j1939_client_t client;
    err = e32_j1939_create(&config, &client);
    if (err != E32_OK) {
        printf("Failed to create client: %d\n", err);
        return 1;
    }
    
    /* Connect to network */
    err = e32_j1939_connect(client);
    if (err != E32_OK) {
        printf("Failed to connect: %d\n", err);
        e32_j1939_destroy(client);
        return 1;
    }
    
    printf("Connected as SA=0x%02X\n\n", e32_j1939_get_source_address(client));
    
    /* Subscribe to PGNs */
    e32_j1939_on_pgn(client, E32_PGN_EEC1, on_engine_controller, NULL);
    e32_j1939_on_pgn(client, E32_PGN_ET1, on_engine_temperature, NULL);
    
    /* Request initial data */
    printf("Requesting engine data...\n\n");
    e32_j1939_request_pgn(client, E32_PGN_EEC1, E32_SA_GLOBAL);
    e32_j1939_request_pgn(client, E32_PGN_ET1, E32_SA_GLOBAL);
    
    /* Main loop - poll for messages */
    printf("Monitoring... (Ctrl+C to exit)\n\n");
    
    for (int i = 0; i < 100; i++) {  /* Run for 100 iterations */
        e32_j1939_poll(client);
        
        /* On real hardware, add delay here */
        /* delay_ms(100); */
        
        /* After 50 iterations, send engine control command */
        if (i == 50) {
            printf("\nSending engine control: Target 1200 RPM\n\n");
            e32_engine_control_cmd_t cmd = {
                .target_rpm = 1200,
                .enable = true
            };
            e32_j1939_send_engine_control(client, &cmd);
        }
    }
    
    /* Summary */
    printf("\n======================================\n");
    printf("Session Summary:\n");
    printf("  Messages received: %d\n", engine_state.message_count);
    printf("  Final RPM: %.1f\n", engine_state.rpm);
    printf("  Final Coolant: %d°C\n", engine_state.coolant_temp);
    printf("======================================\n");
    
    /* Cleanup */
    e32_j1939_disconnect(client);
    e32_j1939_destroy(client);
    e32_deinit();
    
    printf("\nDisconnected.\n");
    return 0;
}

/**
 * @file e32_core.c
 * @brief Embedded32 SDK - Core Functions
 * 
 * SDK initialization and version info.
 * 
 * @version 1.0.0
 */

#include "embedded32.h"

#define E32_VERSION "1.0.0"

const char* e32_get_version(void)
{
    return E32_VERSION;
}

e32_error_t e32_init(void)
{
    /*
     * Platform-specific initialization would go here.
     * For example:
     * - Initialize heap memory
     * - Configure clocks
     * - Setup CAN peripheral
     */
    
    return E32_OK;
}

void e32_deinit(void)
{
    /*
     * Platform-specific cleanup would go here.
     */
}

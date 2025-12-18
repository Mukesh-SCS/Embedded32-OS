/**
 * @file embedded32.h
 * @brief Embedded32 SDK - Main Header
 * 
 * Include this file to get access to all SDK functionality.
 * 
 * @version 1.0.0
 */

#ifndef EMBEDDED32_H
#define EMBEDDED32_H

/* Core types and constants */
#include "e32_types.h"

/* J1939 client API */
#include "e32_j1939.h"

/* Codec utilities */
#include "e32_codec.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Get SDK version string
 * @return Version string (e.g., "1.0.0")
 */
const char* e32_get_version(void);

/**
 * @brief Initialize SDK (call once at startup)
 * @return E32_OK on success
 */
e32_error_t e32_init(void);

/**
 * @brief Deinitialize SDK (call at shutdown)
 */
void e32_deinit(void);

#ifdef __cplusplus
}
#endif

#endif /* EMBEDDED32_H */

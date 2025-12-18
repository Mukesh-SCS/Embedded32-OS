# Embedded32 Canonical Example

**The ONE example that demonstrates everything.**

This example shows:
1. Start simulation with Engine ECU
2. JS SDK subscribes to engine data
3. Python SDK sends engine control command
4. Engine ECU responds, RPM changes

---

## Prerequisites

```bash
# From the Embedded32 root directory
npm install
npm run build
```

---

## Step 1: Start the Simulation

Open a terminal and start the J1939 simulation:

```bash
# Terminal 1: Start simulation
npx embedded32 simulate vehicle/basic-truck
```

Expected output:
```
[Simulation] Starting basic-truck...
[Simulation] Engine ECU (SA=0x00) initialized
[Simulation] Transmission ECU (SA=0x03) initialized
[Simulation] Running at 100ms tick rate...
[J1939] EEC1: Engine Speed = 850 RPM
[J1939] ET1: Coolant Temp = 85°C
```

---

## Step 2: JS SDK Subscribes to Engine Data

In a second terminal, run the JS SDK monitor:

```bash
# Terminal 2: JS SDK monitor
node examples/canonical/js-monitor.mjs
```

The JS SDK will:
- Connect as SA=0xF9 (Diagnostic Tool 1)
- Subscribe to EEC1 (engine speed)
- Display engine data as it arrives

Expected output:
```
[JS SDK] Connected as SA=0xF9
[JS SDK] Subscribed to PGN 0xF004 (EEC1)
[JS SDK] Waiting for engine data...
[JS SDK] Engine Speed: 850 RPM (torque: 0%)
[JS SDK] Engine Speed: 850 RPM (torque: 0%)
```

---

## Step 3: Python SDK Sends Command

In a third terminal, run the Python SDK to send an engine control command:

```bash
# Terminal 3: Python SDK command
python examples/canonical/py-command.py 1500
```

This sends:
- PGN 0xEF00 (ENGINE_CONTROL_CMD)
- targetRpm = 1500
- enable = true

Expected output:
```
[Python SDK] Connected as SA=0xFA
[Python SDK] Sending ENGINE_CONTROL_CMD
[Python SDK] Target RPM: 1500, Enable: True
[Python SDK] Command sent successfully
```

---

## Step 4: Observe Engine Response

Back in Terminal 2 (JS SDK), you should see:

```
[JS SDK] Engine Speed: 850 RPM (torque: 0%)
[JS SDK] Engine Speed: 900 RPM (torque: 15%)
[JS SDK] Engine Speed: 1000 RPM (torque: 25%)
[JS SDK] Engine Speed: 1100 RPM (torque: 30%)
[JS SDK] Engine Speed: 1200 RPM (torque: 28%)
[JS SDK] Engine Speed: 1350 RPM (torque: 20%)
[JS SDK] Engine Speed: 1450 RPM (torque: 10%)
[JS SDK] Engine Speed: 1500 RPM (torque: 0%)
```

The engine gradually ramps to the commanded RPM.

---

## Files

| File | Purpose |
|------|---------|
| `js-monitor.mjs` | JS SDK: Subscribe and display engine data |
| `py-command.py` | Python SDK: Send engine control command |
| `README.md` | This file |

---

## What This Proves

1. **SDKs are clients, not simulators** - They connect to an external simulation
2. **Consistent API** - Both SDKs use the same conceptual interface
3. **Real J1939 behavior** - Command → Response → State change
4. **No core modification** - Everything uses the public SDK API

---

## Fault Injection Test

After the engine reaches target RPM, test fault injection:

```bash
# Terminal 3: Inject overheat fault
python examples/canonical/py-command.py --fault overheat
```

Expected result in Terminal 2:
```
[JS SDK] Engine Speed: 1500 RPM (torque: 0%)
[JS SDK] WARNING: Coolant temp rising!
[JS SDK] Coolant: 100°C
[JS SDK] Coolant: 115°C - OVERHEAT CONDITION
[JS SDK] Engine Speed: 1200 RPM (protective shutdown)
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Embedded32 Simulation                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Engine  │  │  Trans   │  │  Brake   │  │ Cluster  │    │
│  │  SA=0x00 │  │  SA=0x03 │  │  SA=0x0B │  │  SA=0x17 │    │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘    │
│       │             │             │             │           │
│       └─────────────┴─────────────┴─────────────┘           │
│                         │                                   │
│                    J1939 Bus                                │
│                         │                                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────┴────┐      ┌────┴────┐     ┌────┴────┐
    │  JS SDK │      │ Python  │     │  C SDK  │
    │ SA=0xF9 │      │  SDK    │     │ (future)│
    │ Monitor │      │ SA=0xFA │     │         │
    └─────────┘      │ Command │     └─────────┘
                     └─────────┘
```

---

## Success Criteria

✅ Simulation runs independently
✅ JS SDK receives decoded SPNs
✅ Python SDK sends command PGN
✅ Engine ECU responds to command
✅ RPM visibly changes in JS output
✅ No modification to core code required

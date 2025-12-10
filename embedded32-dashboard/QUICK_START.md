# Quick Start Guide - Enhanced Dashboard

## 🚀 Start the System

### Terminal 1: WebSocket Bridge
```powershell
cd C:\Users\tripa\Downloads\GitHub_Projects\1Embedded_projectsrepo\Embedded32
node embedded32-tools/dist/cli.js dashboard bridge --port 9000 --iface vcan0
```

### Terminal 2: Dashboard UI
```powershell
cd C:\Users\tripa\Downloads\GitHub_Projects\1Embedded_projectsrepo\Embedded32\embedded32-dashboard
npm run dev
```

### Browser
Open: http://localhost:5173

---

## 🎮 Using the Dashboard

### 1. Connect to Bridge
- URL should show: `ws://localhost:9000`
- Click **Connect** button
- Status should change to "Connected" (green dot)

### 2. Engine Controls
- **Start Engine** - Begin simulation
- **Stop Engine** - Stop simulation
- **+100 / -100** - Adjust RPM (only when running)
- **Inject DM1 Fault** - Add test fault
- **Clear DM1 Fault** - Remove fault

### 3. View Live Data
- **PGN Table** - All J1939 messages
- **Engine Charts** - Real-time graphs
- **DM1 Viewer** - Active faults with severity
- **Bus Stats** - FPS and load percentage

### 4. Search & Filter
- **Search Box** (top right) - Find messages by PGN, SA, name
- **Filter Panel** - Filter by PGN, SA, priority
- **Click Rows** - Open details panel

### 5. Pause & Resume
- **⏸ Pause** - Freeze table (data still buffers)
- **▶ Resume** - Show all buffered data

### 6. Record & Export
- **💾 Download JSON** - Full log with metadata
- **📊 Export CSV** - Spreadsheet format
- Files saved as: `j1939_YYYYMMDD_HHMMSS.json/csv`

---

## 🎨 Visual Indicators

### Colors
- 🔵 **Blue rows** - Engine messages (EEC1)
- 🟠 **Orange rows** - Transmission (ETC1)
- 🟢 **Green rows** - Aftertreatment
- 🔴 **Red rows** - Faults (DM1)

### Severity Badges
- 🔴 **High** - FMI 0 (critical)
- 🟠 **Medium** - FMI 1 (warning)
- 🟡 **Low** - FMI 3 (informational)

### Bus Load
- 🟢 **Green** - < 50% (healthy)
- 🟠 **Orange** - 50-80% (busy)
- 🔴 **Red** - > 80% (overloaded)

---

## 🐛 Troubleshooting

### "Cannot connect"
- Check bridge is running on port 9000
- Check firewall settings
- Try: `ws://127.0.0.1:9000`

### "No data showing"
- Click "Start Engine" in ECU controls
- Check browser console for errors
- Verify WebSocket connection status

### "Search not working"
- Clear search box
- Check for active filters
- Try lowercase search terms

---

## 📝 Command Examples

### From Dashboard to Bridge
```json
// Start engine
{ "type": "command", "target": "engine", "action": "start" }

// Adjust RPM
{ "type": "engine.rpm.adjust", "amount": 100, "targetRpm": 1500 }

// Inject fault
{ "type": "j1939.dm1.inject", "spn": 102, "fmi": 1, "description": "Test Fault" }
```

### From Bridge to Dashboard
```json
// J1939 message
{
  "type": "j1939",
  "timestamp": 1702234567.890,
  "pgn": "0xF004",
  "sa": "0x00",
  "parameters": {
    "engineSpeed": 1580,
    "coolantTemp": 82,
    "name": "EEC1"
  }
}

// Bus stats
{ "type": "stats", "fps": 450, "load": 12.5 }

// DM1 faults
{
  "type": "j1939.dm1",
  "faults": [
    { "spn": 102, "fmi": 1, "description": "Turbocharger Speed Low", "count": 1 }
  ]
}
```

---

## 🎯 Tips

1. **Use search** to quickly find specific PGNs
2. **Click rows** for detailed SPN values
3. **Pause** when you need to inspect data
4. **Export CSV** for Excel analysis
5. **Watch bus load** to avoid overruns
6. **Inject faults** to test DM1 handling

---

## 📚 Key Files

- `src/services/ws.ts` - WebSocket client
- `src/components/PGNTable.tsx` - Main message table
- `src/components/PGNDetailsPanel.tsx` - Details drawer
- `src/components/DM1Viewer.tsx` - Fault display
- `src/components/LogRecorder.tsx` - Export functionality
- `embedded32-tools/src/commands/DashboardBridgeCommand.ts` - Bridge server

---

**For full documentation, see: ENHANCEMENTS.md**

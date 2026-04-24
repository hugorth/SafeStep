// BLE Panel Component
// Deux modes :
//  - Web Bluetooth (si supporté) → connexion directe depuis le navigateur
//  - BLE Gateway Python (ble-gateway.py) → données reçues via WebSocket

const BLEPanel = () => {
    const [bleStatus,          setBleStatus]          = React.useState('disconnected');
    const [lastData,           setLastData]           = React.useState(null);
    const [fallAlert,          setFallAlert]          = React.useState(false);
    const [backendBleConnected, setBackendBleConnected] = React.useState(false);
    const [backendBleConnecting, setBackendBleConnecting] = React.useState(false);
    const lastFallTimeRef = React.useRef(0);


    // Récupère l'état BLE initial depuis le backend
    React.useEffect(() => {
        SafeStepAPI.getDeviceStatus().then(res => {
            if (res?.data?.bleConnected) {
                setBackendBleConnected(true);
            }
        }).catch(() => {});
    }, []);

    React.useEffect(() => {
        // --- Mode Web Bluetooth ---
        BLEManager.onStatusChange = (status) => setBleStatus(status);

        BLEManager.onDataCallback = async (data) => {
            setLastData(data);
            try { await SafeStepAPI.postDeviceData(data); } catch (_) {}
        };

        BLEManager.onFallCallback = async () => {
            const now = Date.now();
            if (now - lastFallTimeRef.current > 8000) {
                lastFallTimeRef.current = now;
                setFallAlert(true);
                try { await SafeStepAPI.recordFall({ location: 'Position inconnue', severity: 'Élevée' }); } catch(e) {}
                setTimeout(() => setFallAlert(false), 8000);
            }
        };

        // --- Mode Gateway Python — écoute les updates WebSocket ---
        SafeStepAPI.on('device_update', (data) => {
            if (!data) return;
            setLastData({
                imu: data.shoe?.sensors?.accelerometer ? {
                    ax: data.shoe.sensors.accelerometer.x,
                    ay: data.shoe.sensors.accelerometer.y,
                    az: data.shoe.sensors.accelerometer.z,
                    gx: data.shoe.sensors.gyroscope?.x ?? 0,
                    gy: data.shoe.sensors.gyroscope?.y ?? 0,
                    gz: data.shoe.sensors.gyroscope?.z ?? 0,
                } : null,
                gps:       data.gps,
                vibration: data.shoe?.sensors?.vibration,
            });
            if (data.fallDetected) {
                const now = Date.now();
                if (now - lastFallTimeRef.current > 8000) {
                    lastFallTimeRef.current = now;
                    setFallAlert(true);
                    SafeStepAPI.recordFall({ location: data.gps?.valid ? `${data.gps.latitude.toFixed(4)}, ${data.gps.longitude.toFixed(4)}` : 'Position inconnue', severity: 'Élevée' }).catch(console.error);
                    setTimeout(() => setFallAlert(false), 8000);
                }
            }
        });

        // Chaussure connectée au backend via BLE gateway → arrêt du spinner
        SafeStepAPI.on('bluetooth_connected', () => {
            setBackendBleConnected(true);
            setBackendBleConnecting(false);
        });

        // Chaussure déconnectée du backend
        SafeStepAPI.on('bluetooth_disconnected', () => {
            setBackendBleConnected(false);
            setBackendBleConnecting(false);
        });

        return () => {
            BLEManager.onStatusChange = null;
            BLEManager.onDataCallback = null;
            BLEManager.onFallCallback = null;
        };
    }, []);

    const handleGatewayConnect = () => {
        if (!backendBleConnected && !backendBleConnecting) {
            setBackendBleConnecting(true);
        }
    };

    const imu       = lastData?.imu;
    const gps       = lastData?.gps;
    const vibration = lastData?.vibration;
    const isLive    = bleStatus === 'connected' || backendBleConnected;

    // Status Web Bluetooth direct
    const statusColor = bleStatus === 'connected'  ? '#10B981'
                      : bleStatus === 'connecting' ? '#F59E0B'
                      : '#EF4444';

    const statusLabel = bleStatus === 'connected'  ? 'Connectée (BLE direct)'
                      : bleStatus === 'connecting' ? 'Connexion en cours...'
                      : 'Déconnectée';

    // Status BLE gateway backend
    const gatewayColor = backendBleConnected  ? '#10B981'
                       : backendBleConnecting ? '#F59E0B'
                       : '#EF4444';

    const gatewayLabel = backendBleConnected  ? 'Backend connecté à la chaussure'
                       : backendBleConnecting ? 'En attente de connexion...'
                       : 'Backend non connecté';

    return (
        <div className="metric-card mb-6">
            {fallAlert && (
                <div className="mb-3 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <Icon name="alert-triangle" size={18} color="#EF4444" />
                    <span className="text-red-600 font-semibold text-sm">Chute détectée !</span>
                </div>
            )}

            <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Icon name="bluetooth" size={20} color="#0EA5E9" />
                Chaussure Connectée
            </h3>

            {/* --- Section Gateway Backend --- */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Gateway BLE (backend)</p>
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: gatewayColor }}></div>
                    <span className="text-sm font-semibold" style={{ color: gatewayColor }}>{gatewayLabel}</span>
                    {backendBleConnected && <span className="text-xs text-slate-400 ml-auto">Live ●</span>}
                </div>

                {!backendBleConnected && (
                    <button
                        onClick={handleGatewayConnect}
                        disabled={backendBleConnecting}
                        className="w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                        style={{ background: '#0EA5E9' }}>
                        {backendBleConnecting ? (
                            <>
                                <svg className="animate-spin h-4 w-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                En attente de connexion...
                            </>
                        ) : (
                            <>
                                <Icon name="bluetooth" size={16} />
                                Se connecter au Bluetooth
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* --- Données capteurs en direct --- */}
            {isLive && imu && (
                <div className="p-3 bg-slate-50 rounded-lg text-xs font-mono space-y-2">
                    <div>
                        <span className="font-sans font-semibold text-slate-500">Accéléromètre (g)</span>
                        <div className="flex gap-3 mt-1">
                            <span>X <b>{imu.ax?.toFixed(2)}</b></span>
                            <span>Y <b>{imu.ay?.toFixed(2)}</b></span>
                            <span>Z <b>{imu.az?.toFixed(2)}</b></span>
                        </div>
                    </div>
                    <div>
                        <span className="font-sans font-semibold text-slate-500">Gyroscope (°/s)</span>
                        <div className="flex gap-3 mt-1">
                            <span>X <b>{imu.gx?.toFixed(1)}</b></span>
                            <span>Y <b>{imu.gy?.toFixed(1)}</b></span>
                            <span>Z <b>{imu.gz?.toFixed(1)}</b></span>
                        </div>
                    </div>
                    {gps?.valid && (
                        <div>
                            <span className="font-sans font-semibold text-slate-500">GPS</span>
                            <div className="mt-1">
                                {gps.latitude?.toFixed(5)}° N, {gps.longitude?.toFixed(5)}° E — {gps.speed?.toFixed(1)} km/h
                            </div>
                        </div>
                    )}
                    {vibration && (
                        <div className="text-orange-400 font-sans font-semibold flex items-center gap-1">
                            <Icon name="zap" size={14} color="#FB923C" />
                            Vibration
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

if (typeof module !== 'undefined' && module.exports) module.exports = BLEPanel;

// Dashboard Screen Component
const DashboardScreen = ({ currentUser }) => {
    const [dashboardData, setDashboardData] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        loadDashboard();
        
        // Listen for realtime updates
        SafeStepAPI.on('realtime_update', (data) => {
            console.log('📡 Realtime update:', data);
            setDashboardData(prev => prev ? ({
                ...prev,
                health: data.health || prev.health
            }) : null);
        });

        const interval = setInterval(loadDashboard, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        try {
            const response = await SafeStepAPI.getDashboard();
            setDashboardData(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard:', error);
            // Fallback to static data
            setDashboardData({
                device: { connected: true, battery: 78 },
                activity: { steps: 3847, distance: 2.8, calories: 142 },
                location: { latitude: 48.8566, longitude: 2.3522, address: '123 Rue de Paris' },
                health: { heartRate: 72, bloodPressure: '120/80', oxygen: 98 }
            });
            setLoading(false);
        }
    };

    if (loading || !dashboardData) {
        return (
            <div className="p-6 flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Chargement du tableau de bord...</p>
                </div>
            </div>
        );
    }

    const { device, activity, location, health } = dashboardData;
    const connected = device?.connected ?? false;
    const battery = device?.battery ?? 0;
    const steps = activity?.steps ?? 0;
    const distance = activity?.distance ?? 0;
    const calories = activity?.calories ?? 0;

    const handleSOS = async () => {
        if (window.confirm('🚨 Activer le SOS d\'urgence?\n\nLes contacts seront notifiés immédiatement.')) {
            try {
                await SafeStepAPI.activateSOS();
                alert('✅ SOS activé! Contacts d\'urgence notifiés.');
            } catch (error) {
                alert('❌ Erreur lors de l\'activation du SOS: ' + error.message);
            }
        }
    };

    return (
        <div className="p-6 pb-24 animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Bonjour, {currentUser?.name?.split(' ')[0] || 'Utilisateur'}</h1>
                    <p className="text-slate-500">Voici votre activité d'aujourd'hui</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`status-dot ${connected ? 'bg-green-400 active' : 'bg-slate-300'}`}></span>
                    <span className="text-sm font-semibold text-slate-600">
                        {connected ? 'Connecté' : 'Déconnecté'}
                    </span>
                </div>
            </div>

            {/* Map Placeholder */}
            <div className="map-placeholder mb-6 shadow-lg">
                <div className="map-pin"></div>
                <div className="absolute bottom-4 left-4 bg-white px-4 py-2 rounded-lg shadow-md">
                    <p className="text-xs text-slate-500">Position actuelle</p>
                    <p className="font-semibold text-sm">{location?.address || 'Chargement...'}</p>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6 responsive-grid-3">
                <div className="metric-card text-center">
                    <Icon name="footprints" size={28} color="#0EA5E9" className="mx-auto mb-2" />
                    <p className="text-2xl font-bold">{steps.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Pas</p>
                </div>
                <div className="metric-card text-center">
                    <Icon name="route" size={28} color="#10B981" className="mx-auto mb-2" />
                    <p className="text-2xl font-bold">{distance.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">km</p>
                </div>
                <div className="metric-card text-center">
                    <Icon name="flame" size={28} color="#F59E0B" className="mx-auto mb-2" />
                    <p className="text-2xl font-bold">{calories}</p>
                    <p className="text-xs text-slate-500">kcal</p>
                </div>
            </div>

            {/* Battery Status */}
            <div className="metric-card mb-6">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon name="battery-charging" size={20} color="#10B981" />
                        <span className="font-semibold">Batterie</span>
                    </div>
                    <span className="text-2xl font-bold">{battery}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                        style={{ width: `${battery}%` }}
                    ></div>
                </div>
            </div>

            {/* Health Quick View */}
            <div className="metric-card mb-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Icon name="heart-pulse" size={20} color="#EF4444" />
                    Santé
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-red-50 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Fréquence Cardiaque</p>
                        <p className="text-xl font-bold">{health?.heartRate || 72} bpm</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-slate-600 mb-1">Oxygène</p>
                        <p className="text-xl font-bold">{health?.oxygen || 98}%</p>
                    </div>
                </div>
            </div>

            {/* Emergency Button */}
            <button 
                className="btn btn-danger w-full pulse-animation" 
                onClick={handleSOS}
            >
                <Icon name="alert-circle" size={24} />
                <span className="relative z-10">URGENCE SOS</span>
            </button>
        </div>
    );
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardScreen;
}

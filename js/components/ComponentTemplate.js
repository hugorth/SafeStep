/**
 * Template de Composant SafeStep
 * 
 * Copiez ce fichier pour créer un nouveau composant.
 * Remplacez "ComponentTemplate" par le nom de votre composant.
 * 
 * Exemple: HealthStatsScreen, MedicationScreen, etc.
 */

const ComponentTemplate = ({ currentUser, onAction }) => {
    // ==================== STATE ====================
    const [loading, setLoading] = React.useState(true);
    const [data, setData] = React.useState(null);
    const [error, setError] = React.useState(null);

    // ==================== LIFECYCLE ====================
    React.useEffect(() => {
        loadData();
        
        // Cleanup function (optionnel)
        return () => {
            // Code de nettoyage si nécessaire
        };
    }, []); // Dépendances

    // ==================== HANDLERS ====================
    const loadData = async () => {
        setLoading(true);
        setError(null);
        
        try {
            // Appel API
            const response = await SafeStepAPI.getDashboard();
            setData(response.data);
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message);
            
            // Fallback data (optionnel)
            setData({
                // Données de démonstration
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        try {
            // Logique métier
            await SafeStepAPI.activateSOS();
            alert('✅ Action réussie!');
        } catch (err) {
            console.error('Error:', err);
            alert('❌ Erreur: ' + err.message);
        }
    };

    // ==================== RENDER HELPERS ====================
    const renderLoading = () => (
        <div className="p-6 flex items-center justify-center h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-slate-500">Chargement...</p>
            </div>
        </div>
    );

    const renderError = () => (
        <div className="p-6">
            <div className="metric-card bg-red-50 border border-red-200">
                <div className="flex items-start gap-3">
                    <Icon name="alert-circle" size={24} color="#EF4444" />
                    <div>
                        <h3 className="font-bold text-red-600 mb-1">Erreur</h3>
                        <p className="text-sm text-red-600">{error}</p>
                        <button 
                            onClick={loadData}
                            className="mt-3 px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-all"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // ==================== MAIN RENDER ====================
    if (loading) return renderLoading();
    if (error) return renderError();

    return (
        <div className="p-6 pb-24 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Titre du Composant</h2>
                <button 
                    onClick={loadData}
                    className="p-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-all"
                >
                    <Icon name="refresh-cw" size={20} />
                </button>
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {/* Card Example 1 */}
                <div className="metric-card">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Icon name="activity" size={20} color="#0EA5E9" />
                        Section 1
                    </h3>
                    <p className="text-slate-600">Contenu de la section...</p>
                </div>

                {/* Card Example 2 - Grid */}
                <div className="grid grid-cols-2 gap-4 responsive-grid-4">
                    <div className="metric-card text-center">
                        <Icon name="heart" size={28} color="#EF4444" className="mx-auto mb-2" />
                        <p className="text-2xl font-bold">72</p>
                        <p className="text-xs text-slate-500">BPM</p>
                    </div>
                    <div className="metric-card text-center">
                        <Icon name="zap" size={28} color="#F59E0B" className="mx-auto mb-2" />
                        <p className="text-2xl font-bold">98</p>
                        <p className="text-xs text-slate-500">%</p>
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={handleAction}
                    className="btn btn-primary w-full"
                >
                    <Icon name="check" size={20} />
                    <span className="relative z-10">Action</span>
                </button>
            </div>
        </div>
    );
};

// ==================== EXPORT ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ComponentTemplate;
}

/**
 * UTILISATION:
 * 
 * 1. Copiez ce fichier vers js/components/VotreComposant.js
 * 2. Renommez "ComponentTemplate" en "VotreComposant"
 * 3. Ajoutez l'import dans index-modular.html:
 *    <script type="text/babel" src="./js/components/VotreComposant.js"></script>
 * 
 * 4. Ajoutez dans app.js:
 *    case 'votre-ecran': return <VotreComposant currentUser={currentUser} />;
 * 
 * 5. Ajoutez dans le menu de app.js:
 *    { id: 'votre-ecran', label: 'Votre Écran', icon: 'star', color: '#0EA5E9' }
 */

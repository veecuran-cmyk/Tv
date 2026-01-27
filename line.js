// line.js: Lógica de Mapa, Torres, Minions e Eventos Globais

// 1. Definição Geográfica do Mapa
const MAP_LOCATIONS = [
    'BaseAliada', 'BaseInimiga',
    'Mid:T1', 'Mid:T2', 'Mid:T3', 
    'Solo:T1', 'Solo:T2', 'Solo:T3',
    'Duo:T1', 'Duo:T2', 'Duo:T3',
    'Jungle:Matagal1', 'Jungle:Matagal2', 'Jungle:4', 'Jungle:5',
    'Nucleo'
];

// 2. Configurações Iniciais de Saúde e Defesa
const INITIAL_TOWERS_HP = 500;
const NUCLEO_MAX_HP = 2000;

/**
 * Função que gera ondas de minions a cada 30 segundos.
 * Os minions avançam e, se não houver players defendendo, causam dano às torres.
 */
if (typeof gameStateRef !== 'undefined') {
    setInterval(() => {
        gameStateRef.transaction(currentData => {
            if (!currentData) return currentData;

            // Avanço de Minions nas 3 rotas
            const lanes = ['Mid', 'Solo', 'Duo'];
            lanes.forEach(lane => {
                // Se não houver minions, spawna uma nova wave
                if (!currentData.minions) currentData.minions = {};
                if (!currentData.minions[lane]) currentData.minions[lane] = 0;
                
                currentData.minions[lane] += 5; // Adiciona 5 minions por wave

                // Lógica simples: Se houver muitos minions acumulados, eles batem na torre
                if (currentData.minions[lane] > 15) {
                    if (currentData.towers && currentData.towers[lane]) {
                        if (currentData.towers[lane].aliada > 0) {
                             // Minions inimigos batendo na torre aliada (exemplo)
                             // Aqui você pode expandir a lógica de colisão
                        }
                    }
                }
            });

            return currentData;
        });
    }, 30000); // 30 segundos
}

function isPathClear(lane, tier, gameState) {
    if (tier === 1) return true;
    if (tier === 2) return gameState.towers[lane].aliada < 3; // Exemplo: se perdeu 1 torre
    return false;
}

/**
 * Retorna a cor/status de uma localização para o HUD
 */
function getLocationStatus(loc, gameState) {
    if (!gameState) return "Desconhecido";
    if (loc.includes('T1')) return "Torre Externa";
    if (loc.includes('Boss')) return "Território Neutro";
    if (loc === 'Nucleo') return `HP do Núcleo: ${gameState.nucleo_hp}`;
    return "Área Segura";
}

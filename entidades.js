// entidades.js - Sistema de Combate Acelerado e Bestiário Completo
const RESPAWN_MONSTROS = {}; 
let combatInterval = null; 

const Entidades = {
    // --- BANCO DE DADOS (12 Entidades) ---
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, dano: 18, gold: 25, xp: 20, respawn: 30000, esquiva: 0.05 },
        "arqueiro": { nome: "Arqueiro Sombrio", hp_max: 120, dano: 25, gold: 28, xp: 22, respawn: 30000, esquiva: 0.12 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 500, dano: 45, gold: 70, xp: 60, respawn: 45000, esquiva: 0.02 },
        "lobo": { nome: "Lobo das Trevas", hp_max: 300, dano: 35, gold: 85, xp: 75, respawn: 60000, esquiva: 0.15 },
        "golem": { nome: "Golem de Pedra", hp_max: 900, dano: 25, gold: 140, xp: 120, respawn: 60000, esquiva: 0.00 },
        "aranha": { nome: "Tecelã da Noite", hp_max: 280, dano: 60, gold: 150, xp: 130, respawn: 60000, esquiva: 0.22 },
        "dragao": { nome: "Dragão Elemental", hp_max: 2800, dano: 95, gold: 550, xp: 500, respawn: 240000, esquiva: 0.05 },
        "herald": { nome: "Arauto do Caos", hp_max: 2000, dano: 80, gold: 400, xp: 350, respawn: 180000, esquiva: 0.05 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 4500, dano: 135, gold: 950, xp: 850, respawn: 360000, esquiva: 0.08 },
        "tita": { nome: "Titã de Akuma", hp_max: 9500, dano: 210, gold: 2600, xp: 2200, respawn: 600000, esquiva: 0.05 },
        "torre": { nome: "Torre Defensiva", hp_max: 3000, dano: 160, gold: 450, xp: 350, respawn: 0, esquiva: 0 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 8000, dano: 260, gold: 0, xp: 4000, respawn: 0, esquiva: 0 }
    },

    // --- GERADORES E BUSCA ---
    gerarMonstroJungle: function() {
        const selva = ["lobo", "golem", "aranha", "dragao", "herald"];
        const sorteio = selva[Math.floor(Math.random() * selva.length)];
        const ref = this.NPCS[sorteio];
        return { ...ref, hp: ref.hp_max };
    },

    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        if (local.includes("T") && !local.includes(heroType)) {
            const template = local.includes("T3") ? this.NPCS.super_minion : this.NPCS.minion;
            return { ...template, hp: template.hp_max };
        }
        return null;
    },

    gerarBarraVida: function(atual, max) {
        const percent = Math.max(0, Math.min(100, (atual / max) * 100));
        const preenchido = Math.floor(percent / 10);
        const barra = "▰".repeat(preenchido) + "▱".repeat(10 - preenchido);
        const cor = percent > 50 ? "#2ecc71" : percent > 20 ? "#f1c40f" : "#e74c3c";
        return `<span style="color:${cor}; font-family: monospace;">[${barra}] ${Math.ceil(percent)}%</span>`;
    },

    // --- LÓGICA DE COMBATE ---
    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat) return;

        const loc = player.location;
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`⏳ Área em respawn (${espera}s).`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("🍃 Nada para farmar aqui.");

        player.inCombat = true;
        printFunc(`⚔️ <b>Combate: ${mob.nome}</b>`);

        // Intervalo de 1 segundo (Muito mais rápido)
        combatInterval = setInterval(() => {
            // 1. TURNO DO JOGADOR
            let critico = Math.random() < 0.15 ? 1.5 : 1;
            let danoP = Math.floor(Math.max(player.ataque_fisico, player.ataque_magico) * critico * (0.9 + Math.random() * 0.2));
            
            mob.hp -= danoP;

            // CHECAGEM IMEDIATA DE VITÓRIA (CORREÇÃO DE BUG)
            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return; // Encerra o turno aqui mesmo
            }

            // 2. TURNO DO MONSTRO
            let reducao = (player.def_fisica + player.def_magica) * 0.25;
            let danoM = Math.max(5, Math.floor(mob.dano - reducao));
            player.hp -= danoM;

            // Interface
            printFunc(`🗡️ Dano: ${danoP} | 🩸 Recebido: ${danoM}<br>${this.gerarBarraVida(mob.hp, mob.hp_max)}`);
            saveFunc();

            // CHECAGEM DE DERROTA
            if (player.hp <= 0) {
                this.finalizarCombate(player, mob, false, saveFunc, printFunc);
                this.entidadeAtacaEstrutura(loc, mob.dano, printFunc);
            }
        }, 1000); 
    },

    pararCombate: function(player) {
        if (combatInterval) {
            clearInterval(combatInterval);
            combatInterval = null;
        }
        player.inCombat = false;
    },

    finalizarCombate: function(player, mob, vitoria, saveFunc, printFunc) {
        // Para o loop IMEDIATAMENTE antes de qualquer outra ação
        this.pararCombate(player);
        
        if (vitoria) {
            printFunc(`---`);
            printFunc(`🏆 <b>VITÓRIA!</b> Você derrotou ${mob.nome}.`);
            printFunc(`💰 +${mob.gold} Ouro | ✨ +${mob.xp} XP`);
            
            player.gold += mob.gold;
            player.xp += mob.xp;
            
            if (mob.respawn > 0) {
                RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
            }
        } else {
            printFunc(`💀 <b>DERROTA!</b> O combate contra ${mob.nome} acabou.`);
        }
        saveFunc();
    },

    entidadeAtacaEstrutura: function(local, danoMob, printFunc) {
        if (local.includes("Base") || local.includes("T")) {
            setTimeout(() => {
                printFunc(`⚠️ <b>ESTRUTURA:</b> ${local} recebeu ${danoMob} de dano!`);
            }, 500);
        }
    }
};

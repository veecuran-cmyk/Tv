// entidades.js - Sistema de Combate Ultrassônico (Anti-Bug)
const RESPAWN_MONSTROS = {}; 
let combatTimeout = null; // Mudamos para Timeout para maior controle

const Entidades = {
    // --- BESTIÁRIO ---
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, dano: 18, gold: 25, xp: 20, respawn: 30000 },
        "arqueiro": { nome: "Arqueiro Sombrio", hp_max: 120, dano: 25, gold: 28, xp: 22, respawn: 30000 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 500, dano: 45, gold: 70, xp: 60, respawn: 45000 },
        "lobo": { nome: "Lobo das Trevas", hp_max: 300, dano: 35, gold: 85, xp: 75, respawn: 60000 },
        "golem": { nome: "Golem de Pedra", hp_max: 900, dano: 25, gold: 140, xp: 120, respawn: 60000 },
        "aranha": { nome: "Tecelã da Noite", hp_max: 280, dano: 60, gold: 150, xp: 130, respawn: 60000 },
        "dragao": { nome: "Dragão Elemental", hp_max: 2800, dano: 95, gold: 550, xp: 500, respawn: 240000 },
        "herald": { nome: "Arauto do Caos", hp_max: 2000, dano: 80, gold: 400, xp: 350, respawn: 180000 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 4500, dano: 135, gold: 950, xp: 850, respawn: 360000 },
        "tita": { nome: "Titã de Akuma", hp_max: 9500, dano: 210, gold: 2600, xp: 2200, respawn: 600000 },
        "torre": { nome: "Torre Defensiva", hp_max: 3000, dano: 160, gold: 450, xp: 350, respawn: 0 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 8000, dano: 260, gold: 0, xp: 4000, respawn: 0 }
    },

    // --- BUSCA DE INIMIGO ---
    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) {
            const selva = ["lobo", "golem", "aranha", "dragao", "herald"];
            const ref = this.NPCS[selva[Math.floor(Math.random() * selva.length)]];
            return { ...ref, hp: ref.hp_max };
        }
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        if (local.includes("T") && !local.includes(heroType)) {
            const template = local.includes("T3") ? this.NPCS.super_minion : this.NPCS.minion;
            return { ...template, hp: template.hp_max };
        }
        return null;
    },

    // --- SISTEMA DE COMBATE RECURSIVO ---
    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat) return;

        const loc = player.location;
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`⏳ Respawn em ${espera}s...`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("🍃 Nada para farmar aqui.");

        player.inCombat = true;
        printFunc(`⚔️ <b>FARM INICIADO: ${mob.nome}</b>`);

        // Função interna que executa o turno e agenda o próximo
        const executarTurno = () => {
            if (!player.inCombat) return; // Segurança caso tenha fugido

            // 1. ATAQUE DO PLAYER
            let danoP = Math.floor(Math.max(player.ataque_fisico, player.ataque_magico) * (0.9 + Math.random() * 0.2));
            mob.hp -= danoP;

            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return; // INTERROMPE O CICLO
            }

            // 2. ATAQUE DO MOB
            let reducao = (player.def_fisica + player.def_magica) * 0.2;
            let danoM = Math.max(5, Math.floor(mob.dano - reducao));
            player.hp -= danoM;

            printFunc(`🗡️ -${danoP} HP no inimigo | 🩸 Você: ${player.hp.toFixed(0)}`);
            saveFunc();

            if (player.hp <= 0) {
                this.finalizarCombate(player, mob, false, saveFunc, printFunc);
                return; // INTERROMPE O CICLO
            }

            // AGENDA O PRÓXIMO TURNO EM 800ms (Mais rápido que 1s)
            combatTimeout = setTimeout(executarTurno, 800);
        };

        executarTurno();
    },

    pararCombate: function(player) {
        player.inCombat = false;
        if (combatTimeout) {
            clearTimeout(combatTimeout);
            combatTimeout = null;
        }
    },

    finalizarCombate: function(player, mob, vitoria, saveFunc, printFunc) {
        // RESET TOTAL ANTES DE QUALQUER PRINT
        this.pararCombate(player);
        
        if (vitoria) {
            printFunc(`---`);
            printFunc(`🏆 <b>VITÓRIA!</b> +${mob.gold}g | +${mob.xp}xp`);
            player.gold += mob.gold;
            player.xp += mob.xp;
            
            if (mob.respawn > 0) {
                RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
            }
        } else {
            printFunc(`💀 <b>MORTE!</b> O combate parou.`);
        }
        saveFunc();
    }
};

// entidades.js - Sistema de Combate v3 (Correção de Travamento e Recompensas)
const RESPAWN_MONSTROS = {}; 
let combatTimeout = null; 

const Entidades = {
    // --- BESTIÁRIO TURBINADO (XP e Gold aumentados em 300%) ---
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, dano: 18, gold: 150, xp: 100, respawn: 10000 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 500, dano: 45, gold: 400, xp: 350, respawn: 20000 },
        "lobo": { nome: "Lobo das Trevas", hp_max: 300, dano: 35, gold: 300, xp: 250, respawn: 30000 },
        "golem": { nome: "Golem de Pedra", hp_max: 900, dano: 25, gold: 600, xp: 500, respawn: 30000 },
        "aranha": { nome: "Tecelã da Noite", hp_max: 280, dano: 60, gold: 550, xp: 450, respawn: 30000 },
        "dragao": { nome: "Dragão Elemental", hp_max: 3000, dano: 100, gold: 3000, xp: 2500, respawn: 120000 },
        "herald": { nome: "Arauto do Caos", hp_max: 2000, dano: 80, gold: 2000, xp: 1500, respawn: 90000 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 4500, dano: 140, gold: 5000, xp: 4000, respawn: 180000 },
        "tita": { nome: "Titã de Akuma", hp_max: 9500, dano: 220, gold: 15000, xp: 10000, respawn: 300000 },
        "torre": { nome: "Torre Defensiva", hp_max: 3000, dano: 160, gold: 1500, xp: 1000, respawn: 0 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 8000, dano: 280, gold: 50000, xp: 20000, respawn: 0 }
    },

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

    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat === true) {
            return printFunc("⚠️ <b>Você já está em batalha!</b> Aguarde terminar.");
        }

        const loc = player.location;
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`⏳ Área vazia. Respawn em ${espera}s.`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("🍃 Nada para farmar aqui.");

        player.inCombat = true; 
        printFunc(`⚔️ <b>FARM INICIADO: ${mob.nome}</b>`);

        const executarTurno = () => {
            if (!player.inCombat) return;

            // DANO DO JOGADOR
            let danoP = Math.floor(Math.max(player.ataque_fisico, player.ataque_magico) * (0.9 + Math.random() * 0.2));
            mob.hp -= danoP;

            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return;
            }

            // DANO DO MONSTRO
            let reducao = (player.def_fisica + player.def_magica) * 0.2;
            let danoM = Math.max(5, Math.floor(mob.dano - reducao));
            player.hp -= danoM;

            printFunc(`🗡️ <b>-${danoP} HP</b> no inimigo | 🩸 Você: <b>${player.hp.toFixed(0)}</b>`);
            saveFunc();

            if (player.hp <= 0) {
                this.finalizarCombate(player, mob, false, saveFunc, printFunc);
                return;
            }

            // Próximo turno rápido (600ms)
            combatTimeout = setTimeout(executarTurno, 600);
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
        this.pararCombate(player); // Primeiro libera o player
        
        if (vitoria) {
            printFunc(`--------------------------------`);
            printFunc(`🏆 <b>VITÓRIA CONTRA ${mob.nome.toUpperCase()}!</b>`);
            printFunc(`💰 <b>+${mob.gold} GOLD</b> | ✨ <b>+${mob.xp} XP</b>`);
            printFunc(`--------------------------------`);
            
            player.gold += mob.gold;
            player.xp += mob.xp;
            
            if (mob.respawn > 0) RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
        } else {
            printFunc(`💀 <b>VOCÊ CAIU EM COMBATE!</b>`);
        }
        
        // SALVAMENTO CRÍTICO: Força o Firebase a registrar o inCombat = false
        saveFunc();
    }
};

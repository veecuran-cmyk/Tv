// entidades.js - Sistema de Combate Refatorado
const RESPAWN_MONSTROS = {};
let combatInterval = null;

const Entidades = {
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, hp: 150, dano: 15, gold: 25, xp: 20, respawn: 30000 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 400, hp: 400, dano: 40, gold: 60, xp: 50, respawn: 45000 },
        "monstro_jungle": { nome: "Criatura da Selva", hp_max: 500, hp: 500, dano: 35, gold: 90, xp: 80, respawn: 60000 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 3500, hp: 3500, dano: 90, gold: 600, xp: 500, respawn: 180000 },
        "torre": { nome: "Torre Defensiva", hp_max: 2500, hp: 2500, dano: 120, gold: 300, xp: 200, respawn: 300000 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 5000, hp: 5000, dano: 200, gold: 1000, xp: 1000, respawn: 0 }
    },

    gerarMonstroJungle: function() {
        const monstros = [
            { nome: "Lobo das Trevas", hp_m: 300, atk: 25, g: 70 },
            { nome: "Golem de Pedra", hp_m: 700, atk: 15, g: 130 },
            { nome: "Aranha Gigante", hp_m: 280, atk: 55, g: 140 }
        ];
        const s = monstros[Math.floor(Math.random() * monstros.length)];
        return { 
            nome: s.nome, hp_max: s.hp_m, hp: s.hp_m, 
            dano: s.atk, gold: s.g, xp: Math.floor(s.g * 0.8), respawn: 60000 
        };
    },

    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        if (local.includes("T") && !local.includes(heroType)) {
            return local.includes("T3") ? { ...this.NPCS.super_minion } : { ...this.NPCS.minion };
        }
        return null;
    },

    // --- NOVO: MÉTODO DE ATAQUE MANUAL ---
    atacarManualmente: function(player, saveFunc, printFunc) {
        if (!player.inCombat || !player.currentMob) {
            return printFunc("Você não está em combate com ninguém!");
        }
        
        printFunc("<b>[Ação Manual]</b> Você avança para um golpe extra!");
        this.processarTurno(player, player.currentMob, saveFunc, printFunc);
    },

    // --- LÓGICA CENTRALIZADA DE TURNO ---
    processarTurno: function(player, mob, saveFunc, printFunc) {
        let log = "";
        
        // 1. Cálculo de Dano do Jogador
        let danoBase = Math.max(player.ataque_fisico, player.ataque_magico);
        let variacao = 0.9 + Math.random() * 0.2; // 90% a 110%
        let danoPlayer = danoBase * variacao;
        
        if (Math.random() < 0.1) { // 10% chance crítico
            danoPlayer *= 1.5;
            log += "⚡<b>CRÍTICO!</b> ";
        }

        mob.hp -= danoPlayer;
        log += `Você causou <b>${danoPlayer.toFixed(0)}</b> de dano. `;

        // Vampirismo
        if (player.effects.includes('vampirismo')) {
            let cura = danoPlayer * 0.15;
            player.hp = Math.min(player.hp + cura, player.hp_max);
            log += `<span style="color:lime">(+${cura.toFixed(0)} HP)</span> `;
        }

        // Verifica morte do Mob
        if (mob.hp <= 0) {
            printFunc(log);
            this.finalizarCombate(player, mob, true, saveFunc, printFunc);
            return;
        }

        // 2. Contra-ataque do Mob
        let reducao = (player.def_fisica + player.def_magica) * 0.3;
        let danoRecebido = Math.max(5, mob.dano - reducao);
        
        player.hp -= danoRecebido;
        log += `<br>Inimigo revidou: <span style="color:red">-${danoRecebido.toFixed(0)} HP</span>. (HP: ${mob.hp.toFixed(0)})`;

        printFunc(log);
        saveFunc();

        // Verifica morte do Player
        if (player.hp <= 0) {
            printFunc(`<b style="color:red">VOCÊ FOI DERROTADO!</b>`);
            this.finalizarCombate(player, mob, false, saveFunc, printFunc);
            this.entidadeAtacaEstrutura(player.location, mob.dano, printFunc);
        }
    },

    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat) return;

        // Checar Respawn
        if (RESPAWN_MONSTROS[player.location] && Date.now() < RESPAWN_MONSTROS[player.location]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[player.location] - Date.now()) / 1000);
            return printFunc(`Local vazio. Respawn em ${espera}s.`);
        }

        let mob = this.obterInimigoLocal(player.location, player.heroType);
        if (!mob) return printFunc("Nada para lutar aqui.");

        player.inCombat = true;
        player.currentMob = mob; // Armazena o mob no player para acesso manual

        printFunc(`<br>⚔️ <b>COMBATE INICIADO:</b> ${mob.nome}`);
        printFunc(`<i>Dica: Use /atacar para golpear mais rápido!</i>`);

        // Loop Automático (Auto-Attack)
        combatInterval = setInterval(() => {
            this.processarTurno(player, mob, saveFunc, printFunc);
        }, 3000); // Aumentei para 3s para dar tempo do jogador atacar manualmente
    },

    pararCombate: function(player) {
        if (combatInterval) {
            clearInterval(combatInterval);
            combatInterval = null;
        }
        player.inCombat = false;
        player.currentMob = null;
    },

    finalizarCombate: function(player, mob, vitoria, saveFunc, printFunc) {
        this.pararCombate(player);
        if (vitoria) {
            printFunc(`<br>🏆 <b>VITÓRIA!</b> +${mob.gold} Gold | +${mob.xp} XP`);
            player.gold += mob.gold;
            player.xp += mob.xp;
            if (mob.respawn > 0) RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
        }
        saveFunc();
    },

    entidadeAtacaEstrutura: function(local, danoMob, printFunc) {
        if (local.includes("Base") || local.includes("T")) {
            printFunc(`<span style="color:orange">⚠️ A estrutura em ${local} está sob ataque! (-${danoMob} HP)</span>`);
        }
    }
};

// entidades.js - Sistema de Combate Persistente e IA de Estruturas
const RESPAWN_MONSTROS = {}; 
let combatInterval = null; 

const Entidades = {
    // --- BANCO DE DADOS (12 Entidades) ---
    NPCS: {
        // Tropas de Linha (Minions)
        "minion_infantaria": { nome: "Infantaria de Linha", hp_max: 150, dano: 18, gold: 20, xp: 15, respawn: 30000, esquiva: 0.05 },
        "minion_arqueiro": { nome: "Arqueiro Sombrio", hp_max: 120, dano: 25, gold: 22, xp: 18, respawn: 30000, esquiva: 0.12 },
        "super_minion": { nome: "Tropa de Cerco (Tanque)", hp_max: 500, dano: 45, gold: 70, xp: 60, respawn: 45000, esquiva: 0.02 },
        
        // Monstros da Selva (Jungle)
        "lobo": { nome: "Lobo das Trevas", hp_max: 300, dano: 35, gold: 80, xp: 70, respawn: 60000, esquiva: 0.15 },
        "golem": { nome: "Golem de Pedra", hp_max: 850, dano: 25, gold: 130, xp: 110, respawn: 60000, esquiva: 0.00 },
        "aranha": { nome: "Tecelã da Noite", hp_max: 280, dano: 55, gold: 140, xp: 120, respawn: 60000, esquiva: 0.20 },
        "dragao": { nome: "Dragão Elemental", hp_max: 2500, dano: 80, gold: 400, xp: 350, respawn: 180000, esquiva: 0.05 },
        "herald": { nome: "Arauto do Abismo", hp_max: 1800, dano: 70, gold: 300, xp: 280, respawn: 150000, esquiva: 0.05 },

        // Épicos e Chefes
        "boss_rio": { nome: "Sentimonstro do Rio", hp_max: 4500, dano: 120, gold: 800, xp: 700, respawn: 300000, esquiva: 0.08 },
        "titã": { nome: "Titã Esquecido", hp_max: 8000, dano: 180, gold: 2000, xp: 1500, respawn: 600000, esquiva: 0.02 },

        // Estruturas
        "torre": { nome: "Torre Defensiva", hp_max: 3000, dano: 160, gold: 500, xp: 400, respawn: 0, esquiva: 0 },
        "nucleo": { nome: "Núcleo Ancestral", hp_max: 7000, dano: 280, gold: 0, xp: 2000, respawn: 0, esquiva: 0 }
    },

    // --- LÓGICA DE GERAÇÃO ---
    gerarMonstroJungle: function() {
        const monstros = ["lobo", "golem", "aranha", "dragao", "herald"];
        const sorteio = monstros[Math.floor(Math.random() * monstros.length)];
        const ref = this.NPCS[sorteio];
        return { ...ref, hp: ref.hp_max };
    },

    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        // Defesa de território (Torres e Minions)
        if (local.includes("T") && !local.includes(heroType)) {
            const ent = local.includes("T3") ? this.NPCS.super_minion : this.NPCS.minion_infantaria;
            return { ...ent, hp: ent.hp_max };
        }
        return null;
    },

    // --- INTERFACE VISUAL ---
    gerarBarraVida: function(atual, max) {
        const percent = Math.max(0, Math.min(100, (atual / max) * 100));
        const totalBlocos = 10;
        const preenchidos = Math.floor(percent / 10);
        const barra = "▰".repeat(preenchidos) + "▱".repeat(totalBlocos - preenchidos);
        const cor = percent > 50 ? "#2ecc71" : percent > 20 ? "#f1c40f" : "#e74c3c";
        return `<span style="color:${cor}; font-family: monospace;">[${barra}] ${Math.ceil(percent)}%</span>`;
    },

    // --- SISTEMA DE COMBATE AUTOMÁTICO ---
    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat) return printFunc("⚠️ Você já está em combate! Aguarde o desfecho.");

        const loc = player.location;
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const resto = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`⏳ A área está vazia. Respawn em ${resto}s.`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("🍃 tudo tranquilo");

        // Trava de estado
        player.inCombat = true;
        let turno = 0;

        printFunc(`---`);
        printFunc(`⚔️ <b>FARM INICIADO:</b> <span style="color:#e74c3c">${mob.nome}</span>`);
        printFunc(`<i>O combate é automático. Por favor, aguarde...</i>`);
        printFunc(this.gerarBarraVida(mob.hp, mob.hp_max));

        combatInterval = setInterval(() => {
            turno++;
            let log = `<b>T${turno}</b> | `;

            // 1. ATAQUE DO JOGADOR
            const errouP = Math.random() < mob.esquiva;
            if (errouP) {
                log += `💨 Errou! `;
            } else {
                let danoP = Math.max(player.ataque_fisico, player.ataque_magico);
                if (Math.random() < 0.15) { danoP *= 1.7; log += `💥 `; } // Crítico
                danoP = Math.floor(danoP * (0.9 + Math.random() * 0.2));
                
                mob.hp -= danoP;
                log += `🗡️ ${danoP} `;

                if (player.effects.includes('vampirismo')) {
                    player.hp = Math.min(player.hp_max, player.hp + (danoP * 0.15));
                }
            }

            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return;
            }

            // 2. ATAQUE DO INIMIGO
            const esquivaPlayer = (player.agilidade || 5) / 100;
            if (Math.random() < esquivaPlayer) {
                log += `| 🛡️ Desviou!`;
            } else {
                let reducao = (player.def_fisica + player.def_magica) * 0.2;
                let danoM = Math.max(5, Math.floor(mob.dano - reducao));
                player.hp -= danoM;
                log += `| 🩸 <span style="color:#ff7675">-${danoM}</span>`;
            }

            printFunc(`${log}<br>${this.gerarBarraVida(mob.hp, mob.hp_max)}`);
            saveFunc();

            if (player.hp <= 0) {
                this.finalizarCombate(player, mob, false, saveFunc, printFunc);
                this.entidadeAtacaEstrutura(loc, mob, printFunc);
            }

        }, 2000); 
    },

    pararCombate: function(player) {
        if (combatInterval) {
            clearInterval(combatInterval);
            combatInterval = null;
        }
        player.inCombat = false;
    },

    finalizarCombate: function(player, mob, vitoria, saveFunc, printFunc) {
        this.pararCombate(player);
        printFunc(`---`);

        if (vitoria) {
            printFunc(`🏆 <b>VITÓRIA!</b> ${mob.nome} derrotado.`);
            printFunc(`💰 +${mob.gold} Ouro | ✨ +${mob.xp} XP`);
            player.gold += mob.gold;
            player.xp += mob.xp;
            if (mob.respawn > 0) RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
        } else {
            printFunc(`💀 <b>DERROTA...</b> Você caiu diante de ${mob.nome}.`);
            player.hp = 0;
        }
        saveFunc();
    },

    entidadeAtacaEstrutura: function(local, mob, printFunc) {
        if (local.includes("Base") || local.includes("T")) {
            setTimeout(() => {
                printFunc(`⚠️ <b>ESTRUTURA INDEFESA!</b> ${mob.nome} está atacando ${local}!`);
            }, 1000);
        }
    }
};

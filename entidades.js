// entidades.js - Sistema de Combate Evoluído e IA de Estruturas
const RESPAWN_MONSTROS = {};
let combatInterval = null;

const Entidades = {
    // --- BANCO DE DADOS DE ENTIDADES ---
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, dano: 18, gold: 25, xp: 20, respawn: 30000, esquiva: 0.05 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 450, dano: 45, gold: 65, xp: 55, respawn: 45000, esquiva: 0.02 },
        "monstro_jungle": { nome: "Criatura da Selva", hp_max: 550, dano: 40, gold: 95, xp: 85, respawn: 60000, esquiva: 0.08 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 4000, dano: 110, gold: 700, xp: 600, respawn: 300000, esquiva: 0.10 },
        "torre": { nome: "Torre Defensiva", hp_max: 3000, dano: 150, gold: 400, xp: 300, respawn: 0, esquiva: 0 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 6000, dano: 250, gold: 1500, xp: 1000, respawn: 0, esquiva: 0 }
    },

    // --- GERADORES ---
    gerarMonstroJungle: function() {
        const tipos = [
            { nome: "Lobo das Trevas", hp_m: 350, atk: 30, g: 75, e: 0.15 },
            { nome: "Golem de Pedra", hp_m: 800, atk: 20, g: 140, e: 0.02 },
            { nome: "Aranha Tecelã", hp_m: 320, atk: 60, g: 150, e: 0.20 }
        ];
        const s = tipos[Math.floor(Math.random() * tipos.length)];
        return { 
            nome: s.nome, hp_max: s.hp_m, hp: s.hp_m, dano: s.atk, 
            gold: s.g, xp: Math.floor(s.g * 0.9), respawn: 60000, esquiva: s.e 
        };
    },

    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        // Lógica de Torres/Minions Inimigos
        const isEnemyTerritory = (local.includes("T") && !local.includes(heroType));
        if (isEnemyTerritory) {
            const template = local.includes("T3") ? this.NPCS.super_minion : this.NPCS.minion;
            return { ...template, hp: template.hp_max };
        }
        return null;
    },

    // --- UTILITÁRIOS VISUAIS ---
    gerarBarraVida: function(atual, max) {
        const percent = Math.max(0, Math.min(100, (atual / max) * 100));
        const blocos = Math.floor(percent / 10);
        let barra = "▰".repeat(blocos) + "▱".repeat(10 - blocos);
        let cor = percent > 50 ? "#2ecc71" : percent > 20 ? "#f1c40f" : "#e74c3c";
        return `<span style="color:${cor}; font-family: monospace;">[${barra}] ${Math.ceil(percent)}%</span>`;
    },

    // --- SISTEMA DE COMBATE MELHORADO ---
    iniciarCombate: function(player, saveFunc, printFunc) {
        if (player.inCombat) return;

        const loc = player.location;
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`⏳ Área em recuperação. Respawn em ${espera}s.`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("🍃 A área parece segura por enquanto.");

        // Configuração
        player.inCombat = true;
        let turnos = 0;
        
        printFunc(`---`);
        printFunc(`⚔️ <b>COMBATE INICIADO:</b> <span style="color:#e74c3c">${mob.nome}</span>`);
        printFunc(this.gerarBarraVida(mob.hp, mob.hp_max));

        combatInterval = setInterval(() => {
            turnos++;
            let log = `<b>T${turnos}</b> | `;
            
            // 1. TURNO DO JOGADOR
            const chanceEsquivaMob = Math.random() < (mob.esquiva || 0);
            if (chanceEsquivaMob) {
                log += `💨 ${mob.nome} <b>esquivou</b>! `;
            } else {
                let danoP = Math.max(player.ataque_fisico, player.ataque_magico);
                let isCrit = Math.random() < 0.15; // 15% Crit chance
                if (isCrit) { danoP *= 1.8; log += `💥 `; }

                danoP = Math.floor(danoP * (0.9 + Math.random() * 0.2));
                mob.hp -= danoP;
                log += `🗡️ <b>${danoP}</b> `;

                // Vampirismo
                if (player.effects.includes('vampirismo')) {
                    let cura = Math.floor(danoP * 0.2);
                    player.hp = Math.min(player.hp + cura, player.hp_max);
                }
            }

            // Checar Morte do Mob
            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return;
            }

            // 2. TURNO DO MONSTRO
            const chanceEsquivaPlayer = Math.random() < (player.agilidade / 100 || 0.05);
            if (chanceEsquivaPlayer) {
                log += `| 🛡️ Você desviou!`;
            } else {
                let reducao = (player.def_fisica + player.def_magica) * 0.25;
                let danoM = Math.max(5, Math.floor(mob.dano - reducao));
                player.hp -= danoM;
                log += `| 🩸 <span style="color:#ff7675">-${danoM}</span>`;
            }

            // Atualização de Interface
            printFunc(`${log}<br>${this.gerarBarraVida(mob.hp, mob.hp_max)}`);
            saveFunc();

            // Checar Morte do Jogador
            if (player.hp <= 0) {
                this.finalizarCombate(player, mob, false, saveFunc, printFunc);
                this.entidadeAtacaEstrutura(loc, mob, printFunc);
            }
        }, 1800); // Turnos ligeiramente mais rápidos
    },

    tentarFugir: function(player, printFunc) {
        if (!player.inCombat) return printFunc("Você não está em combate.");
        
        // 50% de chance de fuga
        if (Math.random() > 0.5) {
            printFunc("🏃 <b>Você conseguiu escapar!</b>");
            this.pararCombate(player);
        } else {
            printFunc("🚫 <b>Fuga falhou!</b> O inimigo bloqueou sua saída.");
        }
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
        
        if (vitoria) {
            printFunc(`---`);
            printFunc(`🏆 <b>VITÓRIA!</b> ${mob.nome} foi abatido.`);
            printFunc(`💰 <b>+${mob.gold}</b> gold | ✨ <b>+${mob.xp}</b> XP`);
            
            player.gold += mob.gold;
            player.xp += mob.xp;
            
            if (mob.respawn > 0) {
                RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
            }
        } else {
            printFunc(`☠️ <b>DERROTA!</b> Você foi nocauteado por ${mob.nome}.`);
            player.hp = 0; // Garante que o sistema de morte seja ativado
        }
        saveFunc();
    },

    entidadeAtacaEstrutura: function(local, mob, printFunc) {
        if (local.includes("Base") || local.includes("T")) {
            setTimeout(() => {
                printFunc(`---`);
                printFunc(`⚠️ <b>ESTRUTURA SOB ATAQUE!</b>`);
                printFunc(`O <span style="color:red">${mob.nome}</span> está destruindo as defesas em ${local}!`);
                printFunc(`Dano causado: <b>${mob.dano * 2}</b>`);
            }, 1000);
        }
    }
};

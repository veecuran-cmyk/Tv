// entidades.js - Combate Persistente e IA de Estruturas
const RESPAWN_MONSTROS = {}; 
let combatInterval = null; // Variável global para segurar o loop do combate

const Entidades = {
    // Banco de dados base (mantido igual, adicionei 'Nucleo' mais forte)
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
        const sorteio = monstros[Math.floor(Math.random() * monstros.length)];
        return { 
            nome: sorteio.nome, hp_max: sorteio.hp_m, hp: sorteio.hp_m,
            dano: sorteio.atk, gold: sorteio.g, xp: Math.floor(sorteio.g * 0.8), respawn: 60000 
        };
    },

    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return { ...this.NPCS.boss_rio, hp: this.NPCS.boss_rio.hp_max }; 
        if (local === "BaseInimiga") return { ...this.NPCS.nucleo, hp: this.NPCS.nucleo.hp_max };

        if (local.includes("T") && !local.includes(heroType)) {
            // Se for torre inimiga
            return local.includes("T3") ? { ...this.NPCS.super_minion, hp: 400 } : { ...this.NPCS.minion, hp: 150 };
        }
        return null;
    },

    // --- NOVA LÓGICA DE COMBATE CONTÍNUO ---
    iniciarCombate: function(player, saveFunc, printFunc) {
        const loc = player.location;
        
        if (player.inCombat) return printFunc("Você já está em combate!");
        
        // Verifica Respawn
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`Local vazio. Respawn em ${espera}s.`);
        }

        let mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("Tudo calmo por aqui.");

        // Configuração Inicial da Luta
        player.inCombat = true;
        let turnos = 0;
        printFunc(`<br>⚔️ <b>INÍCIO DO COMBATE</b> contra <span style="color:red">${mob.nome}</span> (HP: ${mob.hp})`);
        printFunc(`<i>Digite /fugir para tentar escapar.</i>`);

        // Loop de Combate (Roda a cada 2 segundos)
        combatInterval = setInterval(() => {
            turnos++;
            let logCombate = `[Turno ${turnos}] `;
            
            // 1. Jogador Ataca
            // Dano Base + Aleatório de 10%
            let danoPlayer = Math.max(player.ataque_fisico, player.ataque_magico) * (0.9 + Math.random() * 0.2);
            
            // Crítico (Chance fixa de 10% base + buffs)
            let isCrit = Math.random() < 0.1; 
            if (isCrit) { danoPlayer *= 1.5; logCombate += "⚡CRÍTICO! "; }
            
            mob.hp -= danoPlayer;
            logCombate += `Você causou <b>${danoPlayer.toFixed(0)}</b> de dano. `;

            // Verifica se Mob morreu
            if (mob.hp <= 0) {
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return;
            }

            // 2. Monstro Ataca
            let danoMob = mob.dano;
            
            // Defesa do Jogador
            let reducao = (player.def_fisica + player.def_magica) * 0.3;
            let danoRecebido = Math.max(5, danoMob - reducao);
            
            // Efeito Vampirismo (Cura baseada no dano causado)
            if (player.effects.includes('vampirismo')) {
                let cura = danoPlayer * 0.15;
                player.hp = Math.min(player.hp + cura, player.hp_max);
                logCombate += `(Curou +${cura.toFixed(0)}) `;
            }

            player.hp -= danoRecebido;
            logCombate += `Inimigo contra-atacou: <span style="color:red">-${danoRecebido.toFixed(0)} HP</span>.`;

            printFunc(logCombate);
            saveFunc();

            // Verifica se Jogador Morreu
            if (player.hp <= 0) {
                printFunc(`<b style="color:red">VOCÊ CAIU EM COMBATE!</b>`);
                // A lógica de morte do comandos.js vai pegar isso pelo listener
                this.finalizarCombate(player, mob, false, saveFunc, printFunc); 
                
                // IA DA ENTIDADE: Atacar a Torre/Estrutura se o jogador morrer
                this.entidadeAtacaEstrutura(loc, mob.dano, printFunc);
            }

        }, 2000); // Frequência de 2 segundos por turno
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
            printFunc(`<br>🏆 <b>VITÓRIA!</b> ${mob.nome} foi derrotado.`);
            printFunc(`<span style="color:gold">+${mob.gold} Ouro</span> | <span style="color:cyan">+${mob.xp} XP</span>`);
            player.gold += mob.gold;
            player.xp += mob.xp;
            
            if (mob.respawn > 0) {
                RESPAWN_MONSTROS[player.location] = Date.now() + mob.respawn;
            }
        } else {
            printFunc(`O combate terminou.`);
        }
        saveFunc();
    },

    // IA Simples: Se não houver jogador, o monstro ataca a torre
    entidadeAtacaEstrutura: function(local, danoMob, printFunc) {
        if (local.includes("Base") || local.includes("T")) {
            // Aqui você integraria com seu sistema de Torres global (Ex: Firebase)
            // Simulação:
            printFunc(`<span style="color:orange">⚠️ Sem defesa, ${danoMob} de dano foi causado à estrutura em ${local}!</span>`);
            // gameStateRef.child('torres').child(local).transaction(hp => hp - danoMob);
        }
    }
};

// entidades.js - Gerenciamento de Mobs, Jungle Aleatória e Combate
const RESPAWN_MONSTROS = {}; 
let towerStacks = 0; 

const Entidades = {
    // Banco de dados base
    NPCS: {
        "minion": { nome: "Tropa de Infantaria", hp_max: 150, dano: 15, gold: 25, xp: 20, respawn: 30000 },
        "super_minion": { nome: "Tropa de Cerco", hp_max: 400, dano: 40, gold: 60, xp: 50, respawn: 45000 },
        "monstro_jungle": { nome: "Criatura da Selva", hp_max: 500, dano: 35, gold: 90, xp: 80, respawn: 60000 },
        "boss_rio": { nome: "Sentimonstro Gigante", hp_max: 3500, dano: 90, gold: 600, xp: 500, respawn: 180000 },
        "torre": { nome: "Torre Defensiva", hp_max: 2500, dano: 120, gold: 300, xp: 200, respawn: 300000 },
        "nucleo": { nome: "Núcleo Principal", hp_max: 5000, dano: 200, gold: 1000, xp: 1000, respawn: 0 }
    },

    // Lógica de Selva Aleatória
    gerarMonstroJungle: function() {
        const monstros = [
            { nome: "Lobo das Trevas", hp_m: 300, atk: 25, g: 70 },
            { nome: "Acossador das Sombras", hp_m: 450, atk: 40, g: 110 },
            { nome: "Golem de Pedra", hp_m: 700, atk: 15, g: 130 },
            { nome: "Aranha Gigante", hp_m: 280, atk: 55, g: 140 }
        ];
        const sorteio = monstros[Math.floor(Math.random() * monstros.length)];
        return { 
            nome: sorteio.nome, 
            hp_max: sorteio.hp_m, 
            dano: sorteio.atk, 
            gold: sorteio.g, 
            xp: Math.floor(sorteio.g * 0.8),
            respawn: 60000 
        };
    },

    // Identifica o que está no local atual
    obterInimigoLocal: function(local, heroType) {
        if (local.includes("Jungle")) return this.gerarMonstroJungle();
        if (local === "Rio") return this.NPCS.boss_rio;
        if (local === "BaseInimiga") return this.NPCS.nucleo;

        // Lógica de Progressão de Rota (T1 -> T2 -> T3)
        if (local.includes("T")) {
            // Se o local for uma torre inimiga
            if (!local.includes(heroType)) {
                if (local.includes("T3")) return this.NPCS.super_minion;
                return this.NPCS.minion;
            }
        }
        return null;
    },

    // FUNÇÃO PRINCIPAL DE FARM (Chamada pelo comandos.js)
    executarFarm: function(player, saveFunc, printFunc) {
        const loc = player.location;
        
        // Verifica Respawn
        if (RESPAWN_MONSTROS[loc] && Date.now() < RESPAWN_MONSTROS[loc]) {
            const espera = Math.ceil((RESPAWN_MONSTROS[loc] - Date.now()) / 1000);
            return printFunc(`Área vazia. As tropas inimigas chegam em ${espera}s.`);
        }

        const mob = this.obterInimigoLocal(loc, player.heroType);
        if (!mob) return printFunc("Nada para farmar aqui.");

        printFunc(`<b>[COMBATE]</b> Você interceptou: ${mob.nome}`);

        // Lógica de Dano
        let danoInimigo = mob.dano;

        // Aquecimento de Torre/Núcleo
        if (loc.includes('T') || loc === "BaseInimiga") {
            if (!loc.includes(player.heroType)) { // Só esquenta se for estrutura inimiga
                towerStacks++;
                danoInimigo *= (1 + (towerStacks * 0.4));
                printFunc(`<span style="color:red">A estrutura está focando você! (Calor: ${towerStacks})</span>`);
            }
        } else {
            towerStacks = 0; // Reseta se não for torre
        }

        // Aplica o combate
        const danoRecebido = Math.max(5, danoInimigo - (player.def_fisica * 0.5));
        player.hp -= danoRecebido;
        printFunc(`Você recebeu ${danoRecebido.toFixed(0)} de dano.`);

        // Chance de matar baseada no seu ataque
        const danoPlayer = Math.max(player.ataque_fisico, player.ataque_magico);
        if (Math.random() < (danoPlayer / mob.hp_max) || danoPlayer >= mob.hp_max) {
            printFunc(`<span style="color:cyan">VITORIA! +${mob.gold} Gold | +${mob.xp} XP</span>`);
            player.gold += mob.gold;
            player.xp += mob.xp;
            if (mob.respawn > 0) RESPAWN_MONSTROS[loc] = Date.now() + mob.respawn;
            towerStacks = 0;
        } else {
            printFunc(`O inimigo recuou, mas continua defendendo a posição!`);
        }

        saveFunc();
    }
};

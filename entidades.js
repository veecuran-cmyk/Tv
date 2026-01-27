// entidades.js - Recursos da Selva e IA de Defesa
const RESPAWN_RECURSOS = {};

const Entidades = {
    // 1. Definição dos Materiais na Selva
    MATERIAIS: {
        "FragmentoComum": { nome: "Cristal de Mana", xp: 15, raridade: "Comum", respawn: 20000 },
        "FragmentoRaro":   { nome: "Essência de Draco", xp: 45, raridade: "Raro", respawn: 45000 },
        "FragmentoLendario": { nome: "Núcleo Estelar", xp: 150, raridade: "Lendário", respawn: 120000 }
    },

    // 2. IA das Torres e Núcleo (Defesa Automática)
    // Chamado pelo loop global para defender a base
    verificarDefesa: function(player, printFunc) {
        const loc = player.location;
        
        // Se o player estiver em uma estrutura inimiga
        if ((loc.includes("T") || loc === "BaseInimiga") && !loc.includes(player.heroType)) {
            let danoBase = loc === "BaseInimiga" ? 150 : 80;
            
            // Redução por Defesa do Player
            let danoFinal = Math.max(10, danoBase - (player.def_fisica * 0.4));
            player.hp -= danoFinal;
            
            printFunc(`<span style="color:#ff4444">⚠️ A <b>${loc}</b> está te alvejando! Dano: ${danoFinal.toFixed(0)}</span>`);
            return true;
        }
        return false;
    },

    // 3. Lógica de Coleta (Antigo Farmar)
    coletarNaJungle: function(player, printFunc) {
        const loc = player.location;
        if (!loc.includes("Jungle")) return printFunc("Não há materiais raros fora da Selva.");

        if (RESPAWN_RECURSOS[loc] && Date.now() < RESPAWN_RECURSOS[loc]) {
            return printFunc("Esta área já foi explorada. Aguarde o respawn.");
        }

        // Sorteia raridade
        const sorteio = Math.random();
        let materialKey = "FragmentoComum";
        if (sorteio > 0.95) materialKey = "FragmentoLendario";
        else if (sorteio > 0.70) materialKey = "FragmentoRaro";

        const mat = this.MATERIAIS[materialKey];
        
        // Adiciona ao inventário de materiais do player (precisa criar essa array no player)
        if (!player.materiais) player.materiais = [];
        player.materiais.push(materialKey);
        
        player.xp += mat.xp;
        RESPAWN_RECURSOS[loc] = Date.now() + mat.respawn;

        printFunc(`⛏️ Você extraiu: <b style="color:cyan">${mat.nome}</b> (${mat.raridade})!`);
        printFunc(`<i>Leve até a base e use /vender para ganhar ouro.</i>`);
    }
};

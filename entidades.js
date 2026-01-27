// entidades.js - Recursos da Selva e IA de Defesa
const RESPAWN_RECURSOS = {};

const Entidades = {
    // 1. Definição dos Materiais na Selva
    MATERIAIS: {
        "FragmentoComum": { nome: "Cristal de Mana", xp: 15, raridade: "Comum", respawn: 2000 },
    "FragmentoRaro": { nome: "Essência de Draco", xp: 45, raridade: "Raro", respawn: 45000 },
    "FragmentoLendario": { nome: "Núcleo Estelar", xp: 150, raridade: "Lendário", respawn: 120000 },

    // Comuns (Foco em progressão inicial)
    "PedraFerrosa": { nome: "Minério de Ferro", xp: 10, raridade: "Comum", respawn: 2000 },
    "FragmentoCobre": { nome: "Cobre Oxidado", xp: 12, raridade: "Comum", respawn: 2000 },
    "SilicaBrilhante": { nome: "Sílica Vítrea", xp: 18, raridade: "Comum", respawn: 2000 },
    "CarvaoVital": { nome: "Turfa de Carvão", xp: 20, raridade: "Comum", respawn: 2000 },

    // Incomuns (O meio termo necessário)
    "LingotePrata": { nome: "Prata Lunar", xp: 25, raridade: "Incomum", respawn: 30000 },
    "AcoNegro": { nome: "Aço Sombrio", xp: 30, raridade: "Incomum", respawn: 35000 },
    "QuartzoRosa": { nome: "Quartzo do Amor", xp: 35, raridade: "Incomum", respawn: 38000 },
    "PiritaDourada": { nome: "Ouro dos Tolos", xp: 40, raridade: "Incomum", respawn: 40000 },

    // Raros (Materiais de prestígio)
    "ObsidianaFria": { nome: "Obsidiana Glacial", xp: 55, raridade: "Raro", respawn: 50000 },
    "CobaltoCeleste": { nome: "Cobalto Arcano", xp: 65, raridade: "Raro", respawn: 55000 },
    "AdamantiteBruto": { nome: "Fragmento de Adamantite", xp: 75, raridade: "Raro", respawn: 60000 },
    "MithrilPuro": { nome: "Filão de Mithril", xp: 85, raridade: "Raro", respawn: 70000 },

    // Épicos (Alta dificuldade de obtenção)
    "Orichalcum": { nome: "Orichalcum Ancestral", xp: 100, raridade: "Épico", respawn: 85000 },
    "CristalVazio": { nome: "Fragmento do Vazio", xp: 115, raridade: "Épico", respawn: 95000 },
    "PedraSolfar": { nome: "Enxofre Infernal", xp: 125, raridade: "Épico", respawn: 100000 },
    "EletroAzul": { nome: "Âmbar Eletrizado", xp: 135, raridade: "Épico", respawn: 110000 },

    // Lendários (O topo da cadeia)
    "LuzEterna": { nome: "Prisma de Helios", xp: 180, raridade: "Lendário", respawn: 150000 },
    "MateriaEscura": { nome: "Singularidade Estelar", xp: 210, raridade: "Lendário", respawn: 180000 },
    "SangueDragao": { nome: "Rubi Sangue de Dragão", xp: 250, raridade: "Lendário", respawn: 240000 },
    "Divindade": { nome: "Fragmento de Eternium", xp: 500, raridade: "Lendário", respawn: 600000 }
},

    // 2. IA das Torres e Núcleo (Defesa Automática)
    // Chamado pelo loop global para defender a base
    // entidades.js - IA de Defesa Atualizada
verificarDefesa: function(player, printFunc) {
    const loc = player.location;
    const eHeroi = player.heroType === "Heroi";
    const eVilao = player.heroType === "Vilao";

    // Define se o local atual é hostil para o jogador
    let eLocalInimigo = false;

    if (eHeroi) {
        // Se eu sou Herói, locais com "Inimiga" ou torres de vilões (se houver prefixo) são hostis
        if (loc.includes("Inimiga") || loc.includes("Vilao")) eLocalInimigo = true;
    } else if (eVilao) {
        // Se eu sou Vilão, locais com "Aliada" ou "Heroi" são hostis
        if (loc.includes("Aliada") || loc.includes("Heroi")) eLocalInimigo = true;
    }

    // Se o player estiver em uma estrutura inimiga detectada acima
    if (eLocalInimigo) {
        // Aumenta o dano se for o Núcleo (Base), senão dano de Torre (T1, T2...)
        let danoBase = (loc.includes("Base")) ? 150 : 80;
        
        // Redução por Defesa do Player
        let danoFinal = Math.max(10, danoBase - (player.def_fisica * 0.4));
        player.hp -= danoFinal;
        
        printFunc(`<span style="color:#ff4444">⚠️ A estrutura inimiga em <b>${loc}</b> está te alvejando! Dano: ${danoFinal.toFixed(0)}</span>`);
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
        else if (sorteio > 0.995) materialKey = "Divindade";
else if (sorteio > 0.995) materialKey = "Divindade";
else if (sorteio > 0.990) materialKey = "SangueDragao";
else if (sorteio > 0.985) materialKey = "MateriaEscura";
else if (sorteio > 0.980) materialKey = "LuzEterna";
else if (sorteio > 0.960) materialKey = "EletroAzul";
else if (sorteio > 0.940) materialKey = "PedraSolfar";
else if (sorteio > 0.920) materialKey = "CristalVazio";
else if (sorteio > 0.900) materialKey = "Orichalcum";
else if (sorteio > 0.850) materialKey = "MithrilPuro";
else if (sorteio > 0.800) materialKey = "AdamantiteBruto";
else if (sorteio > 0.750) materialKey = "CobaltoCeleste";
else if (sorteio > 0.700) materialKey = "ObsidianaFria";
else if (sorteio > 0.600) materialKey = "PiritaDourada";
else if (sorteio > 0.500) materialKey = "QuartzoRosa";
else if (sorteio > 0.400) materialKey = "AcoNegro";
else if (sorteio > 0.300) materialKey = "LingotePrata";
else if (sorteio > 0.200) materialKey = "CarvaoVital";
else if (sorteio > 0.100) materialKey = "SilicaBrilhante";
else if (sorteio > 0.050) materialKey = "FragmentoCobre";
else if (sorteio >0.99) materialKey= "PedraFerrosa";

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

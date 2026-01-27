// itens.js: Sistema de Receitas, Loja e Efeitos Completos

// 1. Definição dos Itens Menores (Componentes)
const MINI_ITEMS = [
    ...Array.from({length: 4}, (_, i) => `DefFisica+${i+1}`),   // +1 a +4
    ...Array.from({length: 4}, (_, i) => `DefMagica+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `AtaqueFisico+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `AtaqueMagico+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `VelAtaque+${i+1}`)
];

// 2. Receitas: Itens Maiores são feitos de Itens Menores
const RECIPES = {
    'EscudoFisico': { custo: 400, req: ['DefFisica+2'] },
    'EscudoMagico': { custo: 400, req: ['DefMagica+2'] },
    'CuraLeve':     { custo: 200, req: [] }, // Consumível, sem receita
    'CuraPesada':   { custo: 500, req: ['CuraLeve'] },
    'ManaBoostBasico': { custo: 300, req: [] },
    'ManaBoostAvancado': { custo: 600, req: ['ManaBoostBasico'] },
    'AtaqueFisicoMax': { custo: 800, req: ['AtaqueFisico+3', 'VelAtaque+2'] },
    'AtaqueMagicoMax': { custo: 800, req: ['AtaqueMagico+3', 'ManaBoostBasico'] },
    'DefFisicaMax':    { custo: 700, req: ['DefFisica+3', 'EscudoFisico'] },
    'DefMagicaMax':    { custo: 700, req: ['DefMagica+3', 'EscudoMagico'] },
    'Vampirismo':      { custo: 1200, req: ['AtaqueFisico+2', 'CuraLeve'] },
    'ImunidadeTemp':   { custo: 2000, req: ['DefFisicaMax', 'DefMagicaMax'] },
    'FogoInimigoBasico': { custo: 600, req: ['AtaqueMagico+1'] },
    'FogoInimigoAvancado': { custo: 1000, req: ['FogoInimigoBasico', 'AtaqueFisico+2'] },
    'VelBoostBasico': { custo: 400, req: ['VelAtaque+1'] },
    'VelBoostAvancado': { custo: 900, req: ['VelBoostBasico', 'VelAtaque+3'] },
    'ExecucaoBoost': { custo: 1500, req: ['AtaqueFisicoMax'] },
    'InvisItem': { custo: 1800, req: ['VelBoostAvancado'] }
};

const COMPLETE_ITEMS = Object.keys(RECIPES);

// 3. Cálculo de Preços
// No itens.js, garanta que os preços base estejam acessíveis
const ITEM_PRICES = {};

// Preços dos Mini Itens (150g a 600g)
MINI_ITEMS.forEach(item => {
    const level = parseInt(item.split('+')[1]);
    ITEM_PRICES[item] = level * 150; 
});

// Preços dos Itens Completos (Baseado no custo da receita)
Object.entries(RECIPES).forEach(([nome, dados]) => {
    ITEM_PRICES[nome] = dados.custo; // Usa o custo definido na RECIPES
});
// Adiciona preços base dos completos (para exibição)
COMPLETE_ITEMS.forEach(item => {
    let baseCost = RECIPES[item].custo;
    // Soma o preço dos componentes se o jogador fosse comprar do zero
    RECIPES[item].req.forEach(reqItem => {
        if (ITEM_PRICES[reqItem]) baseCost += ITEM_PRICES[reqItem];
        else if (RECIPES[reqItem]) baseCost += 500; // Estimativa para sub-receitas
    });
    ITEM_PRICES[item] = baseCost;
});

function applyItemEffect(p, item) {
    // Efeitos passivos de Itens Menores
    if (item.includes('DefFisica+')) p.def_fisica += (parseInt(item.split('+')[1]) * 5);
    else if (item.includes('DefMagica+')) p.def_magica += (parseInt(item.split('+')[1]) * 5);
    else if (item.includes('AtaqueFisico+')) p.ataque_fisico += (parseInt(item.split('+')[1]) * 8);
    else if (item.includes('AtaqueMagico+')) p.ataque_magico += (parseInt(item.split('+')[1]) * 8);
    else if (item.includes('VelAtaque+')) p.vel_ataque = parseFloat((p.vel_ataque + 0.1).toFixed(1));

    // Efeitos de Itens Completos (Ativos e Passivos)
    switch(item) {
        case 'CuraLeve': p.hp = Math.min(p.hp + 50, p.hp_max); break;
        case 'CuraPesada': p.hp = Math.min(p.hp + 150, p.hp_max); break;
        
        case 'ManaBoostBasico': p.mana_max += 50; p.mana += 50; break;
        case 'ManaBoostAvancado': p.mana_max += 150; p.mana += 150; break;
        
        case 'EscudoFisico': p.def_fisica += 30; break;
        case 'EscudoMagico': p.def_magica += 30; break;
        
        case 'AtaqueFisicoMax': p.ataque_fisico += 50; p.vel_ataque += 0.2; break;
        case 'AtaqueMagicoMax': p.ataque_magico += 60; p.mana_max += 100; break;
        
        case 'DefFisicaMax': p.def_fisica += 60; p.hp_max += 200; break;
        case 'DefMagicaMax': p.def_magica += 60; p.hp_max += 200; break;

        case 'Vampirismo': 
            if (!p.effects.includes('vampirismo')) p.effects.push('vampirismo'); 
            break;
        case 'ImunidadeTemp': 
            if (!p.effects.includes('imunidade')) p.effects.push('imunidade'); 
            break;
        case 'InvisItem': 
            if (!p.effects.includes('invisivel')) p.effects.push('invisivel'); 
            break;
        
        case 'FogoInimigoBasico': p.ataque_magico += 20; break; // Efeito passivo simples
        case 'FogoInimigoAvancado': 
            p.ataque_magico += 40; 
            if (!p.effects.includes('queimadura')) p.effects.push('queimadura'); // Aplica DoT nos inimigos
            break;

        case 'VelBoostBasico': p.vel_ataque += 0.3; break;
        case 'VelBoostAvancado': p.vel_ataque += 0.6; break;
        
        case 'ExecucaoBoost': 
            p.ataque_fisico += 80;
            // Lógica especial seria aplicada no cálculo de dano (dano x2 se inimigo < 30% HP)
            break;
    }
}

/**
 * Verifica compra inteligente (receitas)
 */
function canBuyItem(player, itemName) {
    // 1. É item menor?
    if (MINI_ITEMS.includes(itemName)) {
        const price = ITEM_PRICES[itemName];
        if (player.gold < price) return { can: false, reason: `Ouro insuficiente. Custa ${price}.` };
        return { can: true, price: price, consume: [] };
    }

    // 2. É item completo (Receita)?
    if (RECIPES[itemName]) {
        const recipe = RECIPES[itemName];
        let finalPrice = recipe.custo;
        let itemsToConsume = [];

        // Verifica ingredientes no inventário
        for (let reqItem of recipe.req) {
            const hasItem = player.inventory.indexOf(reqItem);
            if (hasItem > -1) {
                // Jogador tem o item, então só paga o custo de combinação
                itemsToConsume.push(reqItem);
            } else {
                // Jogador NÃO tem o item, paga o preço do item + custo de combinação
                if (ITEM_PRICES[reqItem]) {
                    finalPrice += ITEM_PRICES[reqItem];
                } else {
                    return { can: false, reason: `Você precisa criar o ${reqItem} antes!` };
                }
            }
        }

        if (player.gold < finalPrice) return { can: false, reason: `Ouro insuficiente. Custa ${finalPrice} (Upgrade).` };
        if (player.inventory.length - itemsToConsume.length >= 6) return { can: false, reason: "Inventário cheio." };
        
        return { can: true, price: finalPrice, consume: itemsToConsume };
    }

    return { can: false, reason: "Item não existe." };
}

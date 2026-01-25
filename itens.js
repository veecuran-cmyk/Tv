// itens.js: Definição da Loja, Preços e Efeitos dos Itens

// 1. Itens Menores (Progressão de Atributos)
// Gera automaticamente: DefFisica+1, DefFisica+2... até +4 para cada atributo.
const MINI_ITEMS = [
    ...Array.from({length: 4}, (_, i) => `DefFisica+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `VelAtaque+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `DefMagica+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `AtaqueMagico+${i+1}`),
    ...Array.from({length: 4}, (_, i) => `AtaqueFisico+${i+1}`)
];

// 2. Itens Completos (Efeitos Ativos e Passivos)
const COMPLETE_ITEMS = [
    'EscudoFisico', 'EscudoMagico', 'CuraLeve', 'CuraPesada', 
    'ManaBoostBasico', 'ManaBoostAvancado', 'FogoInimigoBasico', 
    'FogoInimigoAvancado', 'VelBoostBasico', 'VelBoostAvancado',
    'AtaqueFisicoMax', 'AtaqueMagicoMax', 'DefFisicaMax', 'DefMagicaMax',
    'CritBoost', 'Vampirismo', 'ImunidadeTemp', 'ExecucaoBoost', 
    'TeleportItem', 'InvisItem'
];

// 3. Tabela de Preços (Essencial para a lógica de compra no comandos.js)
const ITEM_PRICES = {};
MINI_ITEMS.forEach(item => {
    const level = parseInt(item.split('+')[1]);
    ITEM_PRICES[item] = level * 150; // Itens +1 custam 150, +4 custam 600
});
COMPLETE_ITEMS.forEach(item => {
    ITEM_PRICES[item] = 1000; // Itens complexos custam valor fixo alto
});

function applyItemEffect(p, item) {
    // Lógica para Itens de Atributos (MINI_ITEMS)
    if (item.includes('DefFisica')) p.def_fisica += (parseInt(item.split('+')[1]) * 5);
    else if (item.includes('DefMagica')) p.def_magica += (parseInt(item.split('+')[1]) * 5);
    else if (item.includes('AtaqueFisico')) p.ataque_fisico += (parseInt(item.split('+')[1]) * 8);
    else if (item.includes('AtaqueMagico')) p.ataque_magico += (parseInt(item.split('+')[1]) * 8);
    else if (item.includes('VelAtaque')) p.vel_ataque = parseFloat((p.vel_ataque + 0.1).toFixed(1));

    // Lógica para Itens Completos (Efeitos Especiais)
    switch(item) {
        case 'CuraLeve': 
            p.hp = Math.min(p.hp + 30, p.hp_max); 
            break;
        case 'CuraPesada': 
            p.hp = Math.min(p.hp + 80, p.hp_max); 
            break;
        case 'ManaBoostBasico': 
            p.mana_max += 20; p.mana += 20; 
            break;
        case 'EscudoFisico': 
            p.def_fisica += 25; 
            break;
        case 'EscudoMagico': 
            p.def_magica += 25; 
            break;
        case 'Vampirismo': 
            if (!p.effects.includes('vampirismo')) p.effects.push('vampirismo'); 
            break;
        case 'ImunidadeTemp': 
            if (!p.effects.includes('imunidade')) p.effects.push('imunidade'); 
            break;
        case 'InvisItem': 
            if (!p.effects.includes('invisivel')) p.effects.push('invisivel'); 
            break;
        case 'FogoInimigoAvancado':
            // Este item geralmente é usado em combate via comandos.js ou utimates.js
            p.ataque_fisico += 15;
            break;
    }
}

/**
 * Verifica se o jogador pode comprar o item
 */
function canBuyItem(player, itemName) {
    const price = ITEM_PRICES[itemName];
    if (!price) return { can: false, reason: "Item não existe." };
    if (player.gold < price) return { can: false, reason: `Ouro insuficiente. Custa ${price}.` };
    if (player.inventory && player.inventory.length >= 6) return { can: false, reason: "Inventário cheio." };
    return { can: true, price: price };
}

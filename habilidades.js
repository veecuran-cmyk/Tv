// habilidades.js: Processamento lógico de combate e habilidades Q, W, E


function processSkill(key, p, t) {
    if (!p) return { msg: "Erro: Atacante não identificado.", success: false };
    if (!t) return { msg: "Selecione um alvo válido!", success: false };

    // 1. Verificação de Proximidade (Só ataca se estiver no mesmo local)
    if (p.location !== t.location) {
        return { msg: `O alvo está em ${t.location}, mas você está em ${p.location}.`, success: false };
    }

    // 2. Verificação de Mana
    const manaCosts = { q: 10, w: 20, e: 30 };
    const cost = manaCosts[key];
    if (p.mana < cost) return { msg: "Mana insuficiente!", success: false };

    // 3. Definição de Variáveis de Combate
    let damage = 0;
    let healing = 0;
    let logMsg = "";
    p.mana -= cost;

    // 4. Lógica Específica por Herói
    const h = p.heroType;

    // Helper para simplificar: Dano Físico e Mágico
    const phys = (mult) => p.ataque_fisico * mult;
    const mag = (mult) => p.ataque_magico * mult;

    switch (h) {
        case 'GatoPreto':
            if (key === 'q') damage = phys(1.2);
            if (key === 'w') logMsg = "Aumentou velocidade de ataque!"; // Efeito visual
            if (key === 'e') { damage = phys(0.5); applyEffect(t, 'stun', 1); }
            break;

        case 'Joaninha':
            if (key === 'q') healing = mag(1.5) + 10;
            if (key === 'w') applyEffect(p, 'escudo', 2);
            if (key === 'e') applyEffect(t, 'debuff_def', 2);
            break;

        case 'Raposa':
            if (key === 'q') damage = mag(1.0);
            if (key === 'w') applyEffect(p, 'invisivel', 3);
            if (key === 'e') applyEffect(t, 'confusao', 2);
            break;

        case 'Abelha':
            if (key === 'q') damage = phys(1.1);
            if (key === 'w') applyEffect(t, 'veneno', 3);
            if (key === 'e') applyEffect(t, 'paralisia', 1);
            break;

        case 'Tartaruga':
            if (key === 'q') applyEffect(p, 'escudo', 5);
            if (key === 'w') logMsg = "Provocou os inimigos!";
            if (key === 'e') damage = p.def_fisica * 0.7;
            break;

        case 'Pavao':
            if (key === 'q') damage = mag(0.8);
            if (key === 'w') logMsg = "Invocou um Sentimonstro!";
            if (key === 'e') applyEffect(t, 'lentidao', 2);
            break;

        case 'Borboleta':
            if (key === 'q') applyEffect(t, 'marcado', 5);
            if (key === 'w') healing = 15;
            if (key === 'e') logMsg = "Revelou a posição do inimigo!";
            break;

        case 'Cavalo':
            if (key === 'q') logMsg = "Abriu um portal!";
            if (key === 'w') damage = phys(0.8);
            if (key === 'e') logMsg = "Teletransportou para base!";
            break;

        case 'Rato':
            if (key === 'q') applyEffect(p, 'clones', 2);
            if (key === 'w') damage = phys(0.5) * 3;
            if (key === 'e') healing = 10;
            break;

        case 'Touro':
            if (key === 'q') damage = phys(1.5);
            if (key === 'w') applyEffect(p, 'imunidade', 2);
            if (key === 'e') applyEffect(t, 'stun', 1);
            break;

        case 'Tigre':
            if (key === 'q') damage = phys(2.0);
            if (key === 'w') applyEffect(p, 'furioso', 2);
            if (key === 'e') damage = phys(0.5);
            break;

        case 'Coelho':
            if (key === 'q') logMsg = "Entrou na Toca!";
            if (key === 'w') logMsg = "Previu o futuro!";
            if (key === 'e') healing = 20;
            break;

        case 'Cobra':
            if (key === 'q') damage = phys(0.9);
            if (key === 'w') logMsg = "Marcou o tempo atual!";
            if (key === 'e') applyEffect(t, 'veneno', 2);
            break;

        case 'Cabra':
            if (key === 'q') logMsg = "Criou um objeto mágico!";
            if (key === 'w') healing = 10;
            if (key === 'e') damage = mag(1.0);
            break;

        case 'Macaco':
            if (key === 'q') applyEffect(t, 'desarmado', 2);
            if (key === 'w') damage = phys(1.0);
            if (key === 'e') logMsg = "Bagunçou os itens do alvo!";
            break;

        case 'Galo':
            if (key === 'q') logMsg = "Escolheu um novo status!";
            if (key === 'w') damage = mag(1.2);
            if (key === 'e') logMsg = "Voou alto!";
            break;

        case 'Cachorro':
            if (key === 'q') applyEffect(t, 'marcado_bola', 10);
            if (key === 'w') logMsg = "Buscou o objeto!";
            if (key === 'e') damage = phys(1.0);
            break;

        case 'Porco':
            if (key === 'q') healing = 30;
            if (key === 'w') applyEffect(t, 'sonhando', 2);
            if (key === 'e') logMsg = "Mostrou o desejo do coração!";
            break;

        case 'Dragao':
            if (key === 'q') damage = mag(1.0); // Vento
            if (key === 'w') applyEffect(p, 'invulneravel', 1); // Água
            if (key === 'e') damage = mag(1.5); // Raio
            break;
    }

    // 5. Finalização do Cálculo (Dano vs Defesa)
    if (damage > 0) {
        const defense = p.type.includes('fisico') ? t.def_fisica : t.def_magica;
        const finalDmg = Math.max(damage - (defense / 2), 5); // Garante dano mínimo de 5
        t.hp -= finalDmg;
        logMsg = `Causou ${finalDmg.toFixed(0)} de dano!`;
    }

    if (healing > 0) {
        t.hp = Math.min(t.hp + healing, t.hp_max);
        logMsg = `Curou ${healing.toFixed(0)} de vida!`;
    }

    return { msg: logMsg || "Habilidade executada!", success: true };
}

/**
 * Adiciona um efeito na lista de efeitos do jogador se não existir
 */
function applyEffect(target, effectName, duration) {
    if (!target.effects) target.effects = [];
    if (!target.effects.includes(effectName)) {
        target.effects.push(effectName);
        // Lógica de tempo pode ser tratada no comandos.js ou servidor.js
    }
}

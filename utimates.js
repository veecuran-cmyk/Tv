// utimates.js: Lógica completa das 19 Ultimates

function executeUltimate(p, pName, t, tName, param, allPlayers) {
    if (p.level < 6) return { msg: "Nivel 6 necessario.", success: false };
    if (p.mana < 100) return { msg: "Mana insuficiente.", success: false };

    p.mana -= 100;
    
    let msg = "";
    const heroKeys = Object.keys(HEROES);
    const randomHeroKey = heroKeys[Math.floor(Math.random() * heroKeys.length)];

    p.effects = p.effects || [];
    p.inventory = p.inventory || [];
    if (t) {
        t.effects = t.effects || [];
        t.inventory = t.inventory || [];
    }

    switch (p.heroType) {
        case 'GatoPreto':
            if (t && t.hp < (t.hp_max * 0.3)) {
                t.hp = 0;
                msg = "CATACLISMO! Alvo executado.";
            } else if (t) {
                t.hp -= 300;
                msg = "CATACLISMO! Dano massivo aplicado.";
            }
            break;

        case 'Joaninha':
            const items = ['CuraPesada', 'EscudoFisico', 'EscudoMagico', 'ImunidadeTemp'];
            const randomItem = items[Math.floor(Math.random() * items.length)];
            p.inventory.push(randomItem);
            p.hp = p.hp_max;
            msg = `TALISMA! Voce recebeu ${randomItem} e curou-se totalmente.`;
            break;

        case 'Raposa':
            p.effects.push('invisivel');
            msg = "MIRAGEM! Voce esta invisivel.";
            break;

        case 'Abelha':
            if (t) {
                t.effects.push('paralisia');
                t.hp -= 100;
                msg = "FERROADA! Alvo paralisado.";
            }
            break;

        case 'Tartaruga':
            p.effects.push('invulneravel');
            
            msg = "CASCO! Imunidade a danos ativada.";
            break;

        case 'Pavao':
            const sentimonster = HEROES[randomHeroKey];
            p.q = sentimonster.q;
            p.w = sentimonster.w;
            p.e = sentimonster.e;
            p.hp_max += 200;
            p.hp += 200;
            p.ataque_fisico += 30;
            msg = `AMOK! Sentimonstro de ${randomHeroKey} criado. Seus status e skills mudaram!`;
            break;

        case 'Borboleta':
            if (t) {
                const power = HEROES[randomHeroKey];
                t.r = power.r; 
                t.ataque_magico += 50;
                t.ataque_fisico += 50;
                msg = `AKUMATIZACAO! ${tName} recebeu a Ultimate de ${randomHeroKey} e buff de forca.`;
                playersRef.child(tName).update({r: t.r, ataque_magico: t.ataque_magico, ataque_fisico: t.ataque_fisico});
            }
            break;

        case 'Cavalo':
            if (MAP_LOCATIONS.includes(param)) {
                p.location = param;
                msg = `VIAGEM! Teleportado para ${param}.`;
            } else {
                p.location = 'BaseAliada';
                msg = "VIAGEM! Destino invalido, voltando base.";
            }
            break;

        case 'Rato':
            p.effects.push('evasao_maxima');
            p.vel_ataque += 1.0;
            msg = "MULTIPLICAR! Clones ativos, evasao e velocidade aumentadas.";
            break;

        case 'Touro':
            p.effects.push('imunidade_cc');
            p.def_fisica += 100;
            p.def_magica += 100;
            msg = "RESISTENCIA! Imune a controle e defesa extrema.";
            break;

        case 'Tigre':
            if (t) {
                t.hp -= (p.ataque_fisico * 4);
                t.effects.push('stun');
                msg = "COLISAO! Golpe critico devastador.";
            }
            break;

        case 'Coelho':
            p.hp = p.hp_max;
            p.mana = p.mana_max;
            p.effects = []; 
            msg = "TOCA DO COELHO! Status resetados para o maximo.";
            break;

        case 'Cobra':
            if (t) {
                t.mana = 0;
                t.q_level = 1; t.w_level = 1; t.e_level = 1; 
                msg = "SEGUNDA CHANCE! O tempo do inimigo foi resetado (Mana drenada).";
            }
            break;

        case 'Cabra':
            const itemToCreate = param && param.length > 0 ? param : 'ImunidadeTemp';
            p.inventory.push(itemToCreate);
            msg = `GENESIS! O objeto ${itemToCreate} foi criado.`;
            break;

        case 'Macaco':
            if (t) {
                t.effects.push('silencio');
                t.effects.push('desarmado');
                msg = "ALVOROCO! Inimigo inutilizado.";
            }
            break;

        case 'Galo':
            const selfPower = HEROES[randomHeroKey];
            p.r = selfPower.r;
            p.ataque_magico += 50;
            msg = `SUBLIMACAO! Voce concedeu a si mesmo o poder de ${randomHeroKey}.`;
            break;

        case 'Cachorro':
            if (t) {
                if (t.inventory.length > 0) {
                    const stolen = t.inventory.pop();
                    p.inventory.push(stolen);
                    msg = `PEGA! Roubou ${stolen} de ${tName}.`;
                } else {
                    t.hp -= 150;
                    msg = "PEGA! Mordida causada pois alvo nao tinha itens.";
                }
            }
            break;

        case 'Porco':
            if (t) {
                t.effects.push('presente_controle');
                let victimName = null;
                
                if (allPlayers) {
                    Object.entries(allPlayers).forEach(([name, char]) => {
                        if (name !== tName && name !== pName && char.location === t.location) {
                            if (char.hp < (char.hp_max * 0.4)) {
                                victimName = name;
                            }
                        }
                    });
                }

                if (victimName) {
                    msg = `PRESENTE! ${tName} foi controlado e executou seu aliado ${victimName}!`;
                    playersRef.child(victimName).update({hp: 0}); 
                } else {
                    msg = `PRESENTE! ${tName} esta sob controle mental (Stunado).`;
                    t.effects.push('stun');
                }
            }
            break;

        case 'Dragao':
            if (t) {
                t.hp -= 200;
                t.effects.push('fogo');
                t.effects.push('agua_lenta');
                msg = "DRAGAO ELEMENTAL! Tempestade de raios, agua e fogo.";
            }
            break;
            
        default:
            msg = "Erro na execucao da Ultimate.";
    }

    playersRef.child(pName).update(p);
    if (t) playersRef.child(tName).update(t);
    
    chatRef.push(`[ULTIMATE] ${pName}: ${msg}`);
    return { msg: msg, success: true };
}

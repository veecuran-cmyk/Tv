// heros.js: Definição dos 19 heróis e mecânicas de evolução

const HEROES = {
    'GatoPreto': {
        class: 'atacante', type: 'corpoacorpo fisico', hp_max: 100, hp: 100, mana_max: 50, mana: 50, level: 1, xp: 0,
        def_fisica: 10, vel_ataque: 1.0, def_magica: 5, ataque_magico: 0, ataque_fisico: 20,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Ataque basico', w: 'Dash', e: 'Stun', r: 'Cataclismo', marks: 0, ult_bar: 0
    },
    'Joaninha': {
        class: 'suporte', type: 'distancia magico', hp_max: 80, hp: 80, mana_max: 80, mana: 80, level: 1, xp: 0,
        def_fisica: 5, vel_ataque: 0.8, def_magica: 15, ataque_magico: 25, ataque_fisico: 5,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Cura', w: 'Buff', e: 'Debuff', r: 'Talismã'
    },
    'Raposa': {
        class: 'versatil', type: 'distancia magico', hp_max: 90, hp: 90, mana_max: 70, mana: 70, level: 1, xp: 0,
        def_fisica: 8, vel_ataque: 1.2, def_magica: 10, ataque_magico: 20, ataque_fisico: 10,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Ilusão', w: 'Escape', e: 'Trap', r: 'Miragem', stacks: 0
    },
    'Abelha': {
        class: 'mid', type: 'distancia fisico', hp_max: 85, hp: 85, mana_max: 60, mana: 60, level: 1, xp: 0,
        def_fisica: 12, vel_ataque: 1.1, def_magica: 8, ataque_magico: 5, ataque_fisico: 25,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Sting', w: 'Buzz', e: 'Hive', r: 'Ferroada', stacks: 0
    },
    'Tartaruga': {
        class: 'suporte', type: 'corpoacorpo magico', hp_max: 120, hp: 120, mana_max: 40, mana: 40, level: 1, xp: 0,
        def_fisica: 20, vel_ataque: 0.9, def_magica: 20, ataque_magico: 10, ataque_fisico: 10,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Shield', w: 'Block', e: 'Protect', r: 'Casco'
    },
    'Pavao': {
        class: 'suporte', type: 'distancia magico', hp_max: 70, hp: 70, mana_max: 90, mana: 90, level: 1, xp: 0,
        def_fisica: 5, vel_ataque: 1.0, def_magica: 15, ataque_magico: 30, ataque_fisico: 5,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Feather', w: 'Summon', e: 'Control', r: 'Amokyzacao'
    },
    'Borboleta': {
        class: 'mid', type: 'distancia magico', hp_max: 75, hp: 75, mana_max: 85, mana: 85, level: 1, xp: 0,
        def_fisica: 6, vel_ataque: 1.1, def_magica: 18, ataque_magico: 28, ataque_fisico: 5,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Akuma', w: 'Buff', e: 'Debuff', r: 'Akumatizacao'
    },
    'Cavalo': {
        class: 'versatil', type: 'distancia fisico', hp_max: 95, hp: 95, mana_max: 55, mana: 55, level: 1, xp: 0,
        def_fisica: 10, vel_ataque: 1.3, def_magica: 10, ataque_magico: 10, ataque_fisico: 20,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Portal', w: 'Teleport', e: 'Pull', r: 'Viagem'
    },
    'Rato': {
        class: 'jangle', type: 'corpoacorpo fisico', hp_max: 80, hp: 80, mana_max: 60, mana: 60, level: 1, xp: 0,
        def_fisica: 8, vel_ataque: 1.5, def_magica: 5, ataque_magico: 5, ataque_fisico: 25,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Multiply', w: 'Speed', e: 'Clone', r: 'Multiplicar'
    },
    'Touro': {
        class: 'atacante', type: 'corpoacorpo fisico', hp_max: 110, hp: 110, mana_max: 40, mana: 40, level: 1, xp: 0,
        def_fisica: 18, vel_ataque: 0.9, def_magica: 10, ataque_magico: 5, ataque_fisico: 25,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Charge', w: 'Imune', e: 'Stomp', r: 'Resistencia'
    },
    'Tigre': {
        class: 'jangle', type: 'corpoacorpo fisico', hp_max: 100, hp: 100, mana_max: 50, mana: 50, level: 1, xp: 0,
        def_fisica: 15, vel_ataque: 1.2, def_magica: 8, ataque_magico: 0, ataque_fisico: 30,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Claw', w: 'Pounce', e: 'Roar', r: 'Colisao', ult_bar: 0
    },
    'Coelho': {
        class: 'suporte', type: 'distancia magico', hp_max: 70, hp: 70, mana_max: 90, mana: 90, level: 1, xp: 0,
        def_fisica: 5, vel_ataque: 1.0, def_magica: 20, ataque_magico: 25, ataque_fisico: 5,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Burrow', w: 'Time', e: 'Freeze', r: 'TocaDeCoelho'
    },
    'Cobra': {
        class: 'versatil', type: 'corpoacorpo magico', hp_max: 85, hp: 85, mana_max: 70, mana: 70, level: 1, xp: 0,
        def_fisica: 10, vel_ataque: 1.1, def_magica: 15, ataque_magico: 20, ataque_fisico: 10,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Bite', w: 'Second', e: 'Mark', r: 'SegundaChance', mark_time: 0
    },
    'Cabra': {
        class: 'suporte', type: 'distancia magico', hp_max: 75, hp: 75, mana_max: 80, mana: 80, level: 1, xp: 0,
        def_fisica: 6, vel_ataque: 1.0, def_magica: 18, ataque_magico: 25, ataque_fisico: 5,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Horn', w: 'Grant', e: 'Double', r: 'Genesis'
    },
    'Macaco': {
        class: 'jangle', type: 'corpoacorpo fisico', hp_max: 90, hp: 90, mana_max: 60, mana: 60, level: 1, xp: 0,
        def_fisica: 12, vel_ataque: 1.4, def_magica: 10, ataque_magico: 10, ataque_fisico: 20,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Swing', w: 'Chaos', e: 'Disrupt', r: 'Alvoroco'
    },
    'Galo': {
        class: 'mid', type: 'distancia magico', hp_max: 80, hp: 80, mana_max: 75, mana: 75, level: 1, xp: 0,
        def_fisica: 8, vel_ataque: 1.2, def_magica: 15, ataque_magico: 25, ataque_fisico: 10,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Crow', w: 'Power', e: 'Self', r: 'Sublimacao'
    },
    'Cachorro': {
        class: 'suporte', type: 'distancia fisico', hp_max: 85, hp: 85, mana_max: 65, mana: 65, level: 1, xp: 0,
        def_fisica: 10, vel_ataque: 1.1, def_magica: 10, ataque_magico: 10, ataque_fisico: 20,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Fetch', w: 'Pull', e: 'Steal', r: 'Pega'
    },
    'Porco': {
        class: 'versatil', type: 'distancia magico', hp_max: 75, hp: 75, mana_max: 80, mana: 80, level: 1, xp: 0,
        def_fisica: 7, vel_ataque: 1.0, def_magica: 15, ataque_magico: 25, ataque_fisico: 10,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Gift', w: 'Hypno', e: 'Control', r: 'Presente'
    },
    'Dragao': {
        class: 'atacante', type: 'corpoacorpo magico', hp_max: 95, hp: 95, mana_max: 70, mana: 70, level: 1, xp: 0,
        def_fisica: 12, vel_ataque: 1.2, def_magica: 12, ataque_magico: 20, ataque_fisico: 15,
        q_level: 1, w_level: 3, e_level: 5, r_level: 6,
        q: 'Wind', w: 'Water', e: 'Fire', r: 'Elemental'
    }
};

// Gerencia a subida de nível
function levelUp(p) {
    if (p.xp >= p.level * 100) {
        p.level += 1;
        p.xp = 0;
        p.hp_max += 10;
        p.hp = p.hp_max;
        p.mana_max += 5;
        p.mana = p.mana_max;
        return true;
    }
    return false;
}

// Retorna um herói aleatório (usado por Galo, Borboleta, etc)
function getRandomHero() {
    const keys = Object.keys(HEROES);
    return keys[Math.floor(Math.random() * keys.length)];
}

// Cria uma instância limpa para o Firebase ao logar
function createHeroInstance(heroName, playerName) {
    const base = HEROES[heroName];
    if (!base) return null;
    return {
        ...JSON.parse(JSON.stringify(base)),
        name: playerName,
        location: 'BaseAliada',
        inventory: [],
        effects: []
    };
}

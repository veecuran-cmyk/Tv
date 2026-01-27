// entidades.js — Sistema Avançado de Combate Automático Animado

const RESPAWN_MONSTROS = {};
const COMBATES_ATIVOS = new Map();

function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

const Entidades = {

    // =====================================================
    // BASE DE NPCS
    // =====================================================
    NPCS: {
        minion: { nome: "Tropa de Infantaria", hp_max: 150, dano: 15, gold: 25, xp: 20, respawn: 30000 },
        super_minion: { nome: "Tropa de Cerco", hp_max: 400, dano: 40, gold: 60, xp: 50, respawn: 45000 },
        boss_rio: { nome: "Sentimonstro Gigante", hp_max: 3500, dano: 90, gold: 600, xp: 500, respawn: 180000 },
        torre: { nome: "Torre Defensiva", hp_max: 2500, dano: 120, gold: 300, xp: 200, respawn: 300000 },
        nucleo: { nome: "Núcleo Principal", hp_max: 5000, dano: 200, gold: 1000, xp: 1000, respawn: 0 }
    },

    // =====================================================
    // UTILIDADES VISUAIS
    // =====================================================
    renderBarra(atual, max, size = 18) {
        const pct = Math.max(0, atual) / max;
        const filled = Math.round(pct * size);
        return "█".repeat(filled) + "░".repeat(size - filled);
    },

    animarTurno({ printFunc, textos, delay = 450 }) {
        return new Promise(resolve => {

            let i = 0;

            const seq = setInterval(() => {

                printFunc(textos[i]);
                i++;

                if (i >= textos.length) {
                    clearInterval(seq);
                    resolve();
                }

            }, delay);
        });
    },

    // =====================================================
    // JUNGLE
    // =====================================================
    gerarMonstroJungle() {

        const monstros = [
            { nome: "Lobo das Trevas", hp_max: 300, dano: 25, gold: 70 },
            { nome: "Golem de Pedra", hp_max: 700, dano: 15, gold: 130 },
            { nome: "Aranha Gigante", hp_max: 280, dano: 55, gold: 140 }
        ];

        const base = monstros[Math.floor(Math.random() * monstros.length)];

        return {
            ...base,
            hp: base.hp_max,
            xp: Math.floor(base.gold * 0.8),
            respawn: 60000
        };
    },

    // =====================================================
    // SPAWN
    // =====================================================
    obterInimigoLocal(local, heroType) {

        if (local.includes("Jungle")) return this.gerarMonstroJungle();

        if (local === "Rio") {
            const mob = clone(this.NPCS.boss_rio);
            mob.hp = mob.hp_max;
            return mob;
        }

        if (local === "BaseInimiga") {
            const mob = clone(this.NPCS.nucleo);
            mob.hp = mob.hp_max;
            return mob;
        }

        if (local.includes("T") && !local.includes(heroType)) {

            const base = local.includes("T3")
                ? this.NPCS.super_minion
                : this.NPCS.minion;

            const mob = clone(base);
            mob.hp = mob.hp_max;
            return mob;
        }

        return null;
    },

    // =====================================================
    // COMBATE
    // =====================================================
    iniciarCombate(player, saveFunc, printFunc) {

        const id = player.id || player.nome;
        const loc = player.location;

        if (player.inCombat)
            return printFunc("⚠️ Você já está em combate!");

        const respawnKey = loc;

        if (RESPAWN_MONSTROS[respawnKey] && Date.now() < RESPAWN_MONSTROS[respawnKey]) {
            const t = Math.ceil((RESPAWN_MONSTROS[respawnKey] - Date.now()) / 1000);
            return printFunc(`⏳ Local vazio. Respawn em ${t}s.`);
        }

        const mob = this.obterInimigoLocal(loc, player.heroType);

        if (!mob) return printFunc("Tudo calmo por aqui.");

        player.effects ??= [];
        player.inCombat = true;

        let turno = 0;

        printFunc(`<br>⚔️ <b>COMBATE AUTOMÁTICO INICIADO</b>`);
        printFunc(`Inimigo: <span style="color:red">${mob.nome}</span> (${mob.hp} HP)`);

        const rodarTurno = async () => {

            turno++;

            let eventos = [];

            // ===== ATAQUE PLAYER =====
            let danoPlayer =
                Math.max(player.ataque_fisico, player.ataque_magico) *
                (0.9 + Math.random() * 0.2);

            let crit = Math.random() < 0.1;
            if (crit) danoPlayer *= 1.5;

            mob.hp -= danoPlayer;

            eventos.push(`⚔️ Você investe contra ${mob.nome}...`);
            eventos.push(crit ? "⚡ GOLPE CRÍTICO!" : "💥 Golpe certeiro!");
            eventos.push(`🩸 Inimigo: ${this.renderBarra(mob.hp, mob.hp_max)}`);

            if (mob.hp <= 0) {
                await this.animarTurno({ printFunc, textos: eventos });
                this.finalizarCombate(player, mob, true, saveFunc, printFunc);
                return;
            }

            // ===== ATAQUE MOB =====
            const reducao =
                ((player.def_fisica || 0) +
                    (player.def_magica || 0)) *
                0.3;

            const danoRecebido = Math.max(5, mob.dano - reducao);

            if (player.effects.includes("vampirismo")) {
                const cura = danoPlayer * 0.15;
                player.hp = Math.min(player.hp + cura, player.hp_max);
                eventos.push(`🩸 Vampirismo cura +${cura.toFixed(0)}`);
            }

            player.hp -= danoRecebido;

            eventos.push(`👹 ${mob.nome} contra-ataca!`);
            eventos.push(`❤️ Você: ${this.renderBarra(player.hp, player.hp_max)}`);

            await this.animarTurno({ printFunc, textos: eventos });

            saveFunc();

            if (player.hp <= 0) {

                printFunc(`<b style="color:red">💀 VOCÊ CAIU!</b>`);

                this.finalizarCombate(player, mob, false, saveFunc, printFunc);

                this.entidadeAtacaEstrutura(loc, mob.dano, printFunc);
            }
        };

        const interval = setInterval(rodarTurno, 2300);

        COMBATES_ATIVOS.set(id, interval);
    },

    pararCombate(player) {

        const id = player.id || player.nome;

        const interval = COMBATES_ATIVOS.get(id);

        if (interval) {
            clearInterval(interval);
            COMBATES_ATIVOS.delete(id);
        }

        player.inCombat = false;
    },

    finalizarCombate(player, mob, venceu, saveFunc, printFunc) {

        this.pararCombate(player);

        if (venceu) {

            printFunc(`<br>🏆 <b>VITÓRIA!</b> ${mob.nome} foi derrotado.`);
            printFunc(`💰 +${mob.gold} ouro | ✨ +${mob.xp} XP`);

            player.gold += mob.gold;
            player.xp += mob.xp;

            if (mob.respawn > 0) {
                RESPAWN_MONSTROS[player.location] =
                    Date.now() + mob.respawn;
            }
        }

        saveFunc();
    },

    // =====================================================
    // IA DE ESTRUTURAS
    // =====================================================
    entidadeAtacaEstrutura(local, dano, printFunc) {

        if (local.includes("Base") || local.includes("T")) {

            printFunc(
                `<span style="color:orange">⚠️ Estrutura em ${local} sofreu ${dano} dano!</span>`
            );

            // Firebase:
            // db.ref("estruturas").child(local).transaction(v => v - dano);
        }
    }
};

module.exports = Entidades;

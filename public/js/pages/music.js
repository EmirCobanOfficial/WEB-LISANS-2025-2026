import { api } from '../api.js';
import { state } from '../state.js';

function renderPlayer(data) {
    const container = document.getElementById('music-player-container');
    if (!container) return;

    if (!data || !data.isPlaying || !data.currentTrack) {
        container.innerHTML = `
            <div class="access-denied-notice">
                <i class="fa-solid fa-headphones"></i>
                <h3>Sessizlik...</h3>
                <p>Şu anda bu sunucuda çalan bir müzik yok veya bot bir ses kanalında değil.</p>
            </div>`;
        return;
    }

    const track = data.currentTrack;
    const progressMs = track.progress.current;
    const durationMs = track.progress.end;
    const progressPercent = durationMs > 0 ? (progressMs / durationMs) * 100 : 0;

    container.innerHTML = `
        <div class="music-player-card">
            <img src="${track.thumbnail}" alt="Albüm Kapağı" class="music-thumbnail">
            <div class="music-details">
                <h3 class="music-title">${track.title}</h3>
                <p class="music-author">${track.author}</p>
                <div class="music-progress-bar-container">
                    <div class="music-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                <div class="music-time">
                    <span>${track.progress.timestamp}</span>
                </div>
                <p class="music-requested-by">İsteyen: ${track.requestedBy}</p>
            </div>
            <div class="music-controls">
                <button class="music-control-btn" data-action="togglePause" title="${data.isPaused ? 'Devam Et' : 'Duraklat'}">
                    <i class="fa-solid ${data.isPaused ? 'fa-play' : 'fa-pause'}"></i>
                </button>
                <button class="music-control-btn" data-action="skip" title="Geç">
                    <i class="fa-solid fa-forward-step"></i>
                </button>
                <button class="music-control-btn danger" data-action="stop" title="Durdur">
                    <i class="fa-solid fa-stop"></i>
                </button>
            </div>
        </div>
    `;
}

function renderQueue(tracks) {
    const container = document.getElementById('music-queue-list');
    if (!container) return;

    if (!tracks || tracks.length === 0) {
        container.innerHTML = '<p class="setting-description" style="text-align: center;">Sırada şarkı yok.</p>';
        return;
    }

    container.innerHTML = tracks.map((track, index) => `
        <div class="leaderboard-entry" style="padding: 15px 20px;">
            <span class="leaderboard-rank">${index + 1}</span>
            <div class="leaderboard-user" style="flex-grow: 1;">
                <div class="leaderboard-user-info">
                    <span class="leaderboard-user-tag">${track.title}</span>
                    <span class="list-item-description">${track.author}</span>
                </div>
            </div>
            <div class="leaderboard-stats" style="min-width: auto; gap: 20px;">
                <span class="leaderboard-xp"><span>İsteyen</span>${track.requestedBy}</span>
                <span class="leaderboard-level"><span>Süre</span>${track.duration}</span>
            </div>
        </div>
    `).join('');
}

async function fetchAndRenderMusicData() {
    const playerContainer = document.getElementById('music-player-container');
    const queueContainer = document.getElementById('music-queue-list');
    if (!playerContainer || !queueContainer) return;

    playerContainer.innerHTML = '<p>Müzik verileri yükleniyor...</p>';
    queueContainer.innerHTML = '';

    try {
        const data = await api.getMusicQueue(state.selectedGuildId);
        renderPlayer(data);
        renderQueue(data.tracks);
    } catch (error) {
        playerContainer.innerHTML = `
            <div class="access-denied-notice">
                <i class="fa-solid fa-circle-exclamation"></i>
                <h3>Hata</h3>
                <p>Müzik verileri alınırken bir hata oluştu: ${error.message}</p>
            </div>`;
    }
}

export function initMusicPlayerPage() {
    fetchAndRenderMusicData();

    // Olay dinleyicilerini ayarla
    document.getElementById('music-refresh-btn')?.addEventListener('click', fetchAndRenderMusicData);

    document.getElementById('music-player-container')?.addEventListener('click', async (e) => {
        const button = e.target.closest('.music-control-btn');
        if (button && button.dataset.action) {
            const action = button.dataset.action;
            try {
                await api.controlMusic(state.selectedGuildId, action);
                // Eylem sonrası arayüzü yenilemek için kısa bir gecikme
                setTimeout(fetchAndRenderMusicData, 500);
            } catch (error) {
                console.error(`Müzik kontrol hatası (${action}):`, error);
            }
        }
    });
}

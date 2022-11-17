import { get, set } from 'https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm';
import { getUniqueId } from './utils.js';

export let wasStoreEmpty = false;

export async function getSongs() {
  let songs = await get('pwamp-songs');

  if (!songs) {
    wasStoreEmpty = true;

    // The songs array doesn't even exist, so this is the first time we're running.
    // Add a couple of songs to get started so the app isn't empty.
    songs = [{
      type: 'url',
      id: 'https://drive.google.com/uc?export=download&id=12hwquYXXl1skLSOc5GLiA7NH1b6YeZls',
      title: 'Hinos Ccb Cantados Vol 1',
      artist: 'Jonas-Benichio',
      album: 'Benichio',
      duration: '50:40',
      dateAdded: Date.now()
    },
    {
      type: 'url',
      id: 'https://drive.google.com/uc?export=download&id=17FxLzCT7lCR8luhHxiPxbZA2Ue-DNFYt',
      title: 'Coletânea 1 de Hinos Taboado e Sorocaba',
      artist: 'Taboado e Sorocaba',
      album: 'Hinos-Taboado-Sorocaba',
      duration: '50:40',
      dateAdded: Date.now()
    },
    {
      type: 'url',
      id: 'https://drive.google.com/uc?export=download&id=1FW3WRK_f3vl5lQtrjveCOGz1obwPMN70',
      title: 'Cilene Benichio Jonas Benihio Vol.02',
      artist: 'Jonas-Benichio',
      album: 'Benichio-vol1',
      duration: '60:34',
      dateAdded: Date.now()
    },
    {
      type: 'url',
      id: 'https://drive.google.com/uc?export=download&id=1NISA2h1s0rjTVYS8pvowlI8If5HaCN2F',
      title: 'Hinos Ccb Orquestra Hymns',
      artist: 'Orquestra Hymns',
      album: 'OrquestraHymns',
      duration: '70:29',
      dateAdded: Date.now()
    }];

    await set('pwamp-songs', songs);

    // And store the artwork for those songs.
    await setArtwork('Benichio', 'Benichio-vol1', 'https://redek-dp.github.io/DevSong/songs/capajb.jpg');
    await setArtwork('Hinos-Taboado-Sorocaba', 'https://redek-dp.github.io/DevSong/songs/TaboadoSorocaba.jpg');
    await setArtwork('OrquestraHymns', 'https://redek-dp.github.io/DevSong/songs/OrquestraHymns.jpg');
  }

  // Verify that all songs have the new dateAdded field,
  // If not, set it to the current date.
  for (let i = 0; i < songs.length; i++) {
    let needToStore = false;
    if (!songs[i].dateAdded) {
      songs[i].dateAdded = Date.now();
      needToStore = true;
    }

    if (needToStore) {
      await set('pwamp-songs', songs);
    }
  }

  return songs;
}

/**
 * Get a song by its ID.
 */
export async function getSong(id) {
  const songs = await getSongs();
  return songs.find(song => song.id === id);
}

/**
 * Check if the given remote song URL is already in IDB.
 */
export async function hasRemoteURLSong(url) {
  const songs = await getSongs();
  return !!songs.find(s => s.id === url);
}

/**
 * Add a new remote song to the list of songs in IDB.
 */
export async function addRemoteURLSong(url, title, artist, album, duration) {
  await addSong('url', url, title, artist, album, duration);
}

/**
 * DO NOT LOOP OVER THIS FUNCTION TO IMPORT SEVERAL FILES, THIS WILL LEAD TO
 * AN INCONSISTENT STORE STATE. USE addMultipleLocalFileSongs() INSTEAD.
 * Add a new file song to the list of songs in IDB.
 * The song is expected to be passed as a File object.
 */
export async function addLocalFileSong(file, title, artist, album, duration) {
  const id = getUniqueId();
  await addSong('file', id, title, artist, album, duration, file);
}

/**
 * Add several new file songs to the list of songs in IDB.
 */
export async function addMultipleLocalFileSongs(fileSongs) {
  fileSongs = fileSongs.map(fileSong => {
    return {
      title: fileSong.title,
      artist: fileSong.artist,
      album: fileSong.album,
      duration: fileSong.duration,
      data: fileSong.file,
      type: 'file',
      id: getUniqueId(),
      dateAdded: Date.now()
    }
  });

  let songs = await getSongs();
  songs = [...songs, ...fileSongs];
  await set('pwamp-songs', songs);
}

/**
 * Private implementation of addSong.
 */
async function addSong(type, id, title, artist, album, duration, data = null) {
  const song = {
    type,
    id,
    title,
    artist,
    album,
    duration,
    dateAdded: Date.now(),
    data
  };

  let songs = await getSongs();
  songs.push(song);
  await set('pwamp-songs', songs);
}

/**
 * Given the unique ID to an existing song, edit its title, artist and album.
 */
export async function editSong(id, title, artist, album) {
  const songs = await getSongs();
  const song = songs.find(s => s.id === id);
  if (!song) {
    throw new Error(`Could not find song with id ${id}`);
  }

  song.title = title;
  song.artist = artist;
  song.album = album;

  await set('pwamp-songs', songs);
}

/**
 * Given the unique ID to an existing song, delete it from IDB.
 */
export async function deleteSong(id) {
  let songs = await getSongs();
  songs = songs.filter(song => song.id !== id);
  await set('pwamp-songs', songs);
}

/**
 * Delete all songs from IDB.
 */
export async function deleteAllSongs() {
  await set('pwamp-songs', []);
}

export async function sortSongsBy(field) {
  if (['dateAdded', 'title', 'artist', 'album'].indexOf(field) === -1) {
    return;
  }

  let songs = await getSongs();

  songs = songs.sort((a, b) => {
    if (a[field] < b[field]) {
      return field === 'dateAdded' ? 1 : -1;
    } else if (a[field] > b[field]) {
      return field === 'dateAdded' ? -1 : 1;
    } else {
      return 0;
    }
  });
  await set('pwamp-songs', songs);
}

/**
 * Set the volume in IDB so that we can remember it next time.
 */
export async function setVolume(volume) {
  await set('pwamp-volume', volume);
}

/**
 * Get the stored volume.
 */
export async function getVolume() {
  return await get('pwamp-volume');
}

/**
 * Set a custom skin in IDB.
 */
export async function setCustomSkin(skin) {
  await set('pwamp-customSkin', skin);
}

/**
 * Get the currently stored custom skin.
 */
export async function getCustomSkin(skin) {
  return await get('pwamp-customSkin');
}

/**
 * Store a new artwork for the given artist and album.
 */
export async function setArtwork(artist, album, image) {
  let artworks = await get('pwamp-artworks');
  if (!artworks) {
    artworks = {};
  }
  artworks[`${artist}-${album}`] = image;
  await set('pwamp-artworks', artworks);
}

/**
 * Get the stored artworks.
 */
export async function getArtworks() {
  return await get('pwamp-artworks') || {};
}

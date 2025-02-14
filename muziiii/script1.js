console.log("Let's write JavaScript");
let currentSong = new Audio();
let songs;
let currFolder;

async function getSong(folder) {
    currFolder = folder;
    let response = await fetch(`http://127.0.0.1:3000/${folder}/`);

    let htmlContent = await response.text();

    let div = document.createElement('div');
    div.innerHTML = htmlContent;

    let as = div.getElementsByTagName('a');
    songs = [];

    for (let index = 0; index < as.length; index++) {
        const element = as[index];

        if (element.href.endsWith('.mp3')) {
            let songPath = element.href.split("/").pop();
            let songName = songPath.replace(/^(128-|192-)/, "")
                .replace(/%20/g, " ")
                .replace(".mp3", "");

            if (songName.includes('-')) {
                songName = songName.split('Kbps')[0].trim();
                songName = songName.split('(')[0].trim();
                songName = songName.split('1')[0].trim();
            }
            songs.push(element.href.split(`/${currFolder}/`)[1]);
        }
    }

    let songUL = document.querySelector(".songlist").getElementsByTagName("ul")[0];
    songUL.innerHTML = " ";
    for (const song of songs) {
        songUL.innerHTML += `<li> 
            <img src="music.svg" alt="" class="invert">
            <div class="info">
                <div>${song.replaceAll("%20", " ")}</div>
                <div></div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector('.songlist').getElementsByTagName('li')).forEach(e => {
        e.addEventListener('click', element => {
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim());
        });
    });
}

const playMusic = (track, pause = false) => {
    currentSong.src = `/${currFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

function convertSecondsToMinutes(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    // Ensure that both minutes and seconds are always displayed as two digits
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;

    return formattedMinutes + ':' + formattedSeconds;
}

async function main() {
    await getSong("songs/cs");
    playMusic(songs[0], true);

    // Set the initial volume to full (1.0) when the page loads
    currentSong.volume = 1.0; // Full volume
    document.querySelector('.range').getElementsByTagName("input")[0].value = 100; // Set the volume slider to 100

    let songUl = document.querySelector(".songlist ul");
    if (!songUl) {
        return;
    }

    // Attach an event listener to play, next, and previous buttons 
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector('.songtime').innerHTML = `${convertSecondsToMinutes(currentSong.currentTime)} / ${convertSecondsToMinutes(currentSong.duration)}`;
        document.querySelector('.circle').style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
    });

    // At the end of the song to jump to the next song
    currentSong.addEventListener('ended', () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);

        // Check if there's a next song in the list
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]); // Play the next song
        } else {
            // Optionally, loop back to the first song if you want
            playMusic(songs[0]);
        }
    });

    document.querySelector('.seekbar').addEventListener('click', (e) => {
        let percentage = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector('.circle').style.left = percentage + "%";
        currentSong.currentTime = ((currentSong.duration) * percentage) / 100;
    });

    document.querySelector('.hamburger').addEventListener('click', () => {
        document.querySelector('.left').style.left = "0";
    });

    document.querySelector('.close').addEventListener('click', () => {
        document.querySelector('.left').style.left = "-120%";
    });

    // Add event listeners to previous and next
    previous.addEventListener('click', () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener('click', () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) { // Fixed condition to check if within bounds
            playMusic(songs[index + 1]);
        }
    });

    // Set up the initial volume
    document.querySelector('.range').getElementsByTagName("input")[0].addEventListener('change', (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;

        // Update the volume icon based on the volume level
        if (currentSong.volume === 0) {
            document.querySelector('.volume>img').src = 'mute.svg'; // Show mute icon
        } else {
            document.querySelector('.volume>img').src = 'volume.svg'; // Show volume icon
        }
    });

    // Load the songs whenever the card is loaded
    Array.from(document.getElementsByClassName('card')).forEach(e => {
        e.addEventListener('click', async item => {
            await getSong(`songs/${item.currentTarget.dataset.folder}`);
            // Play the first song of the new folder
            if (songs.length > 0) {
                playMusic(songs[0], true); // Play the first song when loading new songs
            }
        });
    });

    // Add event listener to mute the volume
    document.querySelector('.volume>img').addEventListener('click', e => {
        if (e.target.src.includes('volume.svg')) {
            e.target.src = e.target.src.replace('volume.svg', 'mute.svg');
            currentSong.volume = 0;
            document.querySelector('.range').getElementsByTagName("input")[0].value = 0; // Set slider to 0
        } else {
            e.target.src = e.target.src.replace('mute.svg', 'volume.svg');
            currentSong.volume = 1.0; // Restore to full volume
            document.querySelector('.range').getElementsByTagName("input")[0].value = 100; // Set the volume slider to 100
        }
    });


    let likeIcon = document.querySelector('.like');
    let isLiked = false; // State variable to track if the icon is liked

    // let isLiked = false; // Initialize the liked state

    likeIcon.addEventListener('click', e => {
        if (isLiked) {
            // If already liked, revert to original state
            likeIcon.innerHTML = '♡'; // Change back to an unfilled heart
            likeIcon.style.color = 'black'; // Set to colorless (or any neutral color)
            likeIcon.style.fontSize = '35px'; // Set size for the colorless heart
            likeIcon.style.border = 'none'; // Remove any border

            // Add custom styling to simulate a heart outline
            likeIcon.style.webkitTextStroke = '0.5px white'; // For webkit browsers
            likeIcon.style.textStroke = '0.5px white'; // For other browsers if supported
        } else {
            // If not liked, change to liked state
            likeIcon.innerHTML = '❤️'; // Change to filled heart
            likeIcon.style.color = 'red'; // Change the color to red
            likeIcon.style.fontSize = '24px'; // Set size for the filled heart
            likeIcon.style.border = 'none'; // Remove border for the filled heart
        }
        isLiked = !isLiked; // Toggle the state
    });




}

main();

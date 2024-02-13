class Song {

    public title: string;
    public artist: string;
    public duration: number;
    public isPlaying: boolean = false;
  constructor(title: string, artist: string, duration: number) {
    this.title = title;
    this.artist = artist;
    this.duration = duration;
  }
}
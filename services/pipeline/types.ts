import { Character, Scene, StoryNode } from '../../types';

export interface StoryBeat {
    id: number;
    summary: string;
    locationId: string;
    requiredCharacters: string[]; // List of character IDs
}

export interface StoryOutline {
    title: string;
    synopsis: string; // Global synopsis
    characters: Character[];
    scenes: Scene[];
    beats: StoryBeat[];
}

export interface ScriptFragment {
    beatId: number;
    nodes: StoryNode[];
}

import InteractionLibrary from './InteractionLibrary';

interface MutableInteractionLibrary extends InteractionLibrary {
    set(argName: string, value: string): void;
}

export default MutableInteractionLibrary;

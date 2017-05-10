import * as targaryen from 'targaryen';
import * as nodePath from 'path';

class NotImplementedError extends Error {}

type FirebaseOptions = {
    apiKey?: string
    authDomain?: string
    databaseURL?: string
    storageBucket?: string
    messagingSenderId?: string
}

class Firebase {
    static apps: firebase.app.App[] = [];

    static initializeApp(options: FirebaseOptions, name: string = "[DEFAULT]") {
        const app = new firebase.app.App(options, name);
        Firebase.apps.push(app);
        return app;
    }

    static auth() {
        if (Firebase.apps.length >= 1) {
            return Firebase.apps[0].auth();
        } else {
            throw new Error("Firebase not initialized");
        }
    }

    static database() {
        if (Firebase.apps.length >= 1) {
            return Firebase.apps[0].database();
        } else {
            throw new Error("Firebase not initialized");
        }
    }
}

namespace firebase {
    export class User {
        get displayName(): string | null {
            throw new NotImplementedError();
        }

        get email(): string | null {
            throw new NotImplementedError();
        }

        get emailVerified(): boolean {
            throw new NotImplementedError();
        }

        get isAnonymous(): boolean {
            throw new NotImplementedError();
        }

        get photoURL(): string | null {
            throw new NotImplementedError();
        }

        get uid(): string | null {
            throw new NotImplementedError();
        }
    }
}

namespace firebase.app {
    const DEFAULT_RULES = {
        rules: {
            '.write': 'true',
            '.read': 'true'
        }
    };
    const DEFAULT_DATA = {};
    const DEFAULT_AUTH = null;
    
    export class App {
        private _auth: firebase.auth.Auth;
        private _database: firebase.database.Database;
        private _firebase: targaryen;

        constructor(private _options: FirebaseOptions, private _name: string) {
            this._auth = new firebase.auth.Auth(this);
            this._database = new firebase.database.Database();
            this._firebase = targaryen.database();
        }

        get name(): string {
            return this._name;
        }

        get options(): FirebaseOptions {
            return this._options;
        }

        public auth(): firebase.auth.Auth {
            return this._auth;
        }

        database(): firebase.database.Database {
            return this._database;
        }

        delete(): Promise<void> {
            const index = Firebase.apps.indexOf(this);
            if (index > -1) {
                Firebase.apps.splice(index, 1);
            }

            return Promise.resolve();
        }
    }
}

namespace firebase.auth {
    type Observer<T> = {
        next(value: T): void;
        error(error: any): void;
        complete(): void;
    };

    export class Auth {
        constructor(private app: firebase.app.App) {}

        get currentUser(): firebase.User {
            throw new NotImplementedError();
        }

        onAuthStateChanged(
            nextOrObserver: Observer<firebase.User | null> | ((user: firebase.User) => void),
            error: (error: any) => void,
            completed: () => void
        ) {
            throw new NotImplementedError();
        }

        signInWithCustomToken(token: string): Promise<firebase.User> {
            throw new NotImplementedError();
        }

        signOut(): Promise<void> {
            throw new NotImplementedError();
        }
    }
}

namespace firebase.database {
    type EventType = 
        | 'value'
        | 'child_added'
        | 'child_removed'
        | 'child_changed'
        | 'child_moved';

    export class Database {
        goOffline() {
            throw new NotImplementedError();
        }

        goOnline() {
            throw new NotImplementedError();
        }

        ref(path?: string) {
            throw new NotImplementedError();
        }

        refFromURL(url: string) {
            throw new NotImplementedError();
        }
    }

    class Query {
        constructor() {}

        on(eventType: EventType, callback: (snapshot: DataSnapshot) => void, cancelCallbackOrContext?: Object | ((error: Error) => void), context?: Object) {
            throw new NotImplementedError();
        }
        
        off(eventType: EventType, callback: (snapshot: DataSnapshot) => void, context?: Object) {
            throw new NotImplementedError();
        }

        once(eventType: EventType, sucessCallback: (snapshot: DataSnapshot) => void, failureCallbackOrContext?: Object | ((error: Error) => void), context?: Object): Promise<DataSnapshot> {
            throw new NotImplementedError();
        }
    }

    class Reference extends Query {
        constructor(private path: string, private parent: Reference) {
            super();
        }

        child(path: string) {
            return new Reference(nodePath.join(this.path, path), this);
        }

        push<T>(value?: T, onComplete?: (error?: Error) => void): ThenableReference {
            throw new NotImplementedError();
        }

        remove(onComplete?: (error?: Error) => void): Promise<void> {
            throw new NotImplementedError();
        }

        set<T>(value: T, onComplete?: (error?: Error) => void): Promise<void> {
            throw new NotImplementedError();
        }

        setWithPriority<T>(value: T, newPriority: (string | number | null), onComplete?: (error?: Error) => void): Promise<void> {
            throw new NotImplementedError();
        }

        transaction(
            transactionUpdate: <T>(value: T) => void | T,
            onComplete: (error?: Error, snapshot?: DataSnapshot) => void,
            applyLocally?: boolean
        ): Promise<{committed: boolean, snapshot?: DataSnapshot}> {
            throw new NotImplementedError();
        }

        update(values: Object, onComplete?: (error?: Error) => void): Promise<void> {
            throw new NotImplementedError();
        }
    }

    class ThenableReference extends Reference {
        constructor(path: string, parent: Reference) {
            super(path, parent);
        }

        then() {
            throw new NotImplementedError();
        }
    }

    class DataSnapshot {
        get key(): string {
            throw new NotImplementedError();
        }

        get ref(): Reference {
            throw new NotImplementedError();
        }
    }
}
import * as targaryen from 'targaryen';
import * as nodePath from 'path';

function emptyFunction () {}

class NotImplementedError extends Error {}

namespace Targaryen {
    export type Database = {
        with(options: {rules: Object, data: any, auth?: Object, now?: number, debug?: boolean}): Database;
        as(auth: object | null): Database;
        read(path: string, now?: number): Result;
        write(path: string, value: any, priority?: any, now?: number): Result;
        update(path: string, patch: Object, now?: number): Result;
    }

    export type Result = {
        path: string,
        auth: Object | null,
        permitted: boolean,
        validated: boolean,
        database: Database,
        newDatabase: Database,
        newValue: any
    }
}

type TargaryenStatic = {
    database(rules: Object, data: Object, now?: number): Targaryen.Database;
}


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
    export type UserInfo = {
        displayName?: string,
        email?: string,
        photoURL?: string,
        providerId: string,
        uid: string
    }

    export class User implements UserInfo {
        public displayName?: string;
        public email?: string;
        public photoURL?: string;
        public providerId: string;
        public uid: string;

        constructor(userInfo: UserInfo) {
            Object.assign(this, userInfo);
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

    export class App {
        private _auth: firebase.auth.Auth;
        private _database: firebase.database.Database;
        public mockDatabase: Targaryen.Database;

        constructor(private _options: FirebaseOptions, private _name: string) {
            this._auth = new firebase.auth.Auth(this);
            this._database = new firebase.database.Database(this);
            this.mockDatabase = targaryen.database(DEFAULT_RULES, DEFAULT_DATA);

            // TODO: Dispose
            this._auth.onAuthStateChanged((user) => {
                this.mockDatabase = this.mockDatabase.as(user);
            })
        }

        get name(): string {
            return this._name;
        }

        get options(): FirebaseOptions {
            return this._options;
        }

        auth(): firebase.auth.Auth {
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

    type AuthProvider = {
        providerId: string
    }

    class AuthCredential {
        constructor(public provider: string, public credentials: Object) {}
    }

    export class EmailAuthProvider implements AuthProvider {
        public providerId = "email"

        static credential(email: string, password: string) {
            return new AuthCredential("email", {email, password});
        }
    }

    export class FacebookAuthProvider implements AuthProvider {
        public providerId = "facebook"

        static credential(token: string) {
            return new AuthCredential("facebook", {token});
        }
    }

    export class GithubAuthProvider implements AuthProvider {
        public providerId = "github"

        static credential(token: string) {
            return new AuthCredential("github", {token});
        }
    }

    export class GoogleAuthProvider implements AuthProvider {
        public providerId = "google"

        static credential(token: string) {
            return new AuthCredential("google", {token});
        }
    }

    export class TwitterAuthProvider implements AuthProvider {
        public providerId = "twitter"

        static credential(token: string, secret: string) {
            return new AuthCredential("twitter", {token, secret});
        }
    }

    export class Auth {
        public customTokenSignInHandler: ((token: string) => firebase.UserInfo) | null = null;
        public credentialSignInHandler: ((credential: AuthCredential) => firebase.UserInfo) | null = null;

        private _currentUser: firebase.User | null = null;
        private _authStateObserver: Observer<firebase.User | null>[] = [];
        
        constructor(private app: firebase.app.App) {}

        get currentUser(): firebase.User | null {
            return this._currentUser;
        }

        private notifyAuthState() {
            this._authStateObserver.forEach((observer) => {
                observer.next(this._currentUser);
            })
        }

        onAuthStateChanged(
            nextOrObserver: Observer<firebase.User | null> | ((user: firebase.User) => void),
            error?: (error: any) => void,
            complete?: () => void
        ): () => void {
            if (typeof nextOrObserver === 'object') {
                this._authStateObserver.push(nextOrObserver);
            } else {
                this._authStateObserver.push({next: nextOrObserver || emptyFunction, error: error || emptyFunction, complete: complete || emptyFunction})
            }

            return () => this._authStateObserver.splice(this._authStateObserver.length - 1, 1);
        }

        signInWithCredential(credential: AuthCredential): Promise<firebase.User> {
            if (!this.credentialSignInHandler) {
                return Promise.reject(new Error(
                    "Mock-firebase auth: signInWithCustomToken being used, while no credentialSignInHandler is defined"
                ))
            }

            let userInfo: UserInfo;
            try {
                userInfo = this.credentialSignInHandler(credential);
            } catch (error) {
                return Promise.reject(error);
            }
            
            const user = new firebase.User(userInfo);
            this.notifyAuthState()
            
            return Promise.resolve(user);
        }

        signInWithCustomToken(token: string): Promise<firebase.User> {
            if (!this.customTokenSignInHandler) {
                return Promise.reject(new Error(
                    "Mock-firebase auth: signInWithCustomToken being used, while no customTokenSignInHandler is defined"
                ))
            }

            let userInfo: UserInfo;
            try {
                userInfo = this.customTokenSignInHandler(token);
            } catch (error) {
                return Promise.reject(error);
            }
            
            const user = new firebase.User(userInfo);
            this.notifyAuthState()

            return Promise.resolve(user);
        }

        signOut(): Promise<void> {
            this._currentUser = null;
            this.notifyAuthState()

            return Promise.resolve();
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
        constructor(private _app: firebase.app.App) {}

        get app() {
            return this._app;
        }

        goOffline() {
            throw new NotImplementedError();
        }

        goOnline() {
            throw new NotImplementedError();
        }

        ref(path?: string) {
            return new Reference(this, path || '');
        }

        refFromURL(url: string) {
            throw new NotImplementedError();
        }
    }

    class Query {
        constructor(protected database: Database, protected path: string) {}

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
        constructor(database: Database, path: string) {
            super(database, path);
        }

        child(path: string) {
            return new Reference(this.database, nodePath.join(this.path, path));
        }

        push<T>(value?: T, onComplete?: (error?: Error) => void): ThenableReference {
            throw new NotImplementedError();
        }

        remove(onComplete?: (error?: Error) => void): Promise<void> {
            return this.set(null, onComplete);
        }

        set<T>(value: T, onComplete?: (error?: Error) => void): Promise<void> {
            return this.setWithPriority(value, null, onComplete);
        }

        setWithPriority<T>(value: T, newPriority: (string | number | null), onComplete: (error?: Error) => void = emptyFunction): Promise<void> {
            const result = this.database.app.mockDatabase.write(this.path, value, newPriority);
            this.database.app.mockDatabase = result.newDatabase;
            if (result.permitted && result.validated) {
                onComplete();
                return Promise.resolve();
            } else {
                const error = new Error(
                    `Set operation failed. Permitted: ${result.permitted}. Validated: ${result.validated}`
                );
                onComplete(error)
                return Promise.reject(error)
            }
        }

        transaction(
            transactionUpdate: <T>(value: T) => void | T,
            onComplete: (error?: Error, snapshot?: DataSnapshot) => void,
            applyLocally?: boolean
        ): Promise<{committed: boolean, snapshot?: DataSnapshot}> {
            throw new NotImplementedError();
        }

        update(patch: Object, onComplete: (error?: Error) => void = emptyFunction): Promise<void> {
            const result = this.database.app.mockDatabase.update(this.path, patch);
            this.database.app.mockDatabase = result.newDatabase;
            if (result.permitted && result.validated) {
                onComplete();
                return Promise.resolve();
            } else {
                const error = new Error(
                    `Update operation failed. Permitted: ${result.permitted}. Validated: ${result.validated}`
                );
                onComplete(error)
                return Promise.reject(error)
            }
        }
    }

    class ThenableReference extends Reference {
        constructor(database: Database, path: string) {
            super(database, path);
        }

        then() {
            throw new NotImplementedError();
        }
    }

    class DataSnapshot {
        constructor(private path: string, private data: any) {}

        get key(): string | null {
            return (this.path === '') ? null : nodePath.basename(this.path)
        }

        exists(): boolean {
            return !!this.data;
        }

        val(): any {
            return this.data;
        }
    }
}

export default Firebase;
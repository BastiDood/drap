export * from './app';
export * from './auth';
export * from './email';

// By convention, we initialize the relations last once all tables have been defined.
// It's _technically_ not necessary because the modules are initialized upon import anyway,
// but we might as well do it last for pedantic reasons.
export * from './relation';

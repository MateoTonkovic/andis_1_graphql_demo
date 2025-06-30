const { ApolloServer, gql } = require('apollo-server-express');
const express = require('express');

const typeDefs = gql`
  enum EventType {
    GOAL
    YELLOW_CARD
    RED_CARD
    SUBSTITUTION
    FOUL
  }

  type Team {
    id: ID!
    name: String!
  }

  type Match {
    id: ID!
    homeTeam: Team!
    awayTeam: Team!
    date: String!
    events: [Event!]!
  }

  type Event {
    id: ID!
    matchId: ID!
    minute: Int!
    type: EventType!
    description: String
    team: Team!
  }

  type Query {
    matches: [Match!]!
    match(id: ID!): Match
    eventsByMatch(matchId: ID!): [Event!]!
  }

  input CreateTeamInput {
    name: String!
  }

  input CreateMatchInput {
    homeTeamId: ID!
    awayTeamId: ID!
    date: String!
  }

  input CreateEventInput {
    matchId: ID!
    minute: Int!
    type: EventType!
    description: String
    teamId: ID!
  }

  type Mutation {
    createTeam(input: CreateTeamInput!): Team!
    createMatch(input: CreateMatchInput!): Match!
    createEvent(input: CreateEventInput!): Event!
  }
`;


const teams = [];
const matches = [];
const events = [];

let teamIdCounter = 1;
let matchIdCounter = 1;
let eventIdCounter = 1;

const resolvers = {
    Query: {
        matches: () => matches,
        match: (_, { id }) => matches.find(m => m.id === id),
        eventsByMatch: (_, { matchId }) => events.filter(e => e.matchId === matchId),
    },

    Mutation: {
        createTeam: (_, { input }) => {
            const newTeam = { id: `${teamIdCounter++}`, ...input };
            teams.push(newTeam);
            return newTeam;
        },
        createMatch: (_, { input }) => {
            const homeTeam = teams.find(t => t.id === input.homeTeamId);
            const awayTeam = teams.find(t => t.id === input.awayTeamId);
            if (!homeTeam || !awayTeam) throw new Error("Team not found");

            const newMatch = {
                id: `${matchIdCounter++}`,
                homeTeam,
                awayTeam,
                date: input.date,
                events: []
            };
            matches.push(newMatch);
            return newMatch;
        },
        createEvent: (_, { input }) => {
            const match = matches.find(m => m.id === input.matchId);
            const team = teams.find(t => t.id === input.teamId);
            if (!match || !team) throw new Error("Match or Team not found");

            const newEvent = {
                id: `${eventIdCounter++}`,
                matchId: input.matchId,
                minute: input.minute,
                type: input.type,
                description: input.description,
                team,
            };
            events.push(newEvent);
            match.events.push(newEvent);
            return newEvent;
        },
    },
};

async function startServer() {
    const app = express();
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();
    server.applyMiddleware({ app });

    app.listen({ port: 4000 }, () =>
        console.log(`http://localhost:4000${server.graphqlPath}`)
    );
}

startServer();

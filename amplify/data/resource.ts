import { a, defineData, type ClientSchema } from '@aws-amplify/backend';

/**
 * ===========================================================================
 * data — the AI routes, and DELIBERATELY NOTHING ELSE
 * ===========================================================================
 *
 * This file used to hold the `Todo` model `npm create amplify` writes. It was
 * never deployed and nothing imported it.
 *
 * -- WHY THERE ARE NO MODELS HERE ------------------------------------------
 * Because the game's data already exists, and not in a form this can express.
 * Nine DynamoDB tables -- Players, Lobbies, GameState, Connections, Questions,
 * Matches, ChatMessages, Notifications, PushSubscriptions -- are read and
 * written by two hand-written Lambdas over REST and a WebSocket, and the match
 * engine is a phase machine whose deadlines are driven by Step Functions.
 *
 * Declaring a.model()s here would not adopt any of that. It would create a
 * SECOND set of tables behind AppSync and leave the first set where it is,
 * with two halves of one game disagreeing about who is in which room.
 *
 * The console's Data manager browses AppSync models, so it shows what is
 * declared here and nothing from those nine tables. Worth knowing before
 * going looking for them in it.
 *
 * -- WHAT AI ACTUALLY ADDS -------------------------------------------------
 * These two routes are new capability rather than a second way to do something
 * already done. They are additive: a separate AppSync API beside the existing
 * backend, sharing its Cognito pool through referenceAuth, touching none of
 * its tables.
 */

const schema = a.schema({
  /**
   * A trivia question, generated rather than translated.
   *
   * The Questions table is filled today by importing OpenTDB and running the
   * English through Amazon Translate. That works, and it reads like it: a
   * translated question about American football is still a question about
   * American football, phrased slightly oddly. Generating in Serbian directly
   * produces questions written in Serbian, about things a Serbian player has
   * heard of.
   *
   * Returns the shape questions.mjs already expects, so a generated row and an
   * imported one are the same kind of thing downstream.
   */
  generateQuestion: a
    .generation({
      aiModel: a.ai.model('Claude Sonnet 4.6'),
      systemPrompt: [
        'You write multiple-choice trivia questions for a fast-paced elimination game.',
        'Exactly four options, exactly one correct, and the three wrong ones must be plausible enough to cost a careless player money.',
        'A question must be answerable in under fifteen seconds by someone who knows the subject: no multi-part reasoning, no arithmetic.',
        'Write in the language you are asked for, natively. Never translate: if asked for Serbian, choose subjects a Serbian player would know.',
        'Difficulty 1 is common knowledge, 2 is for someone who follows the subject, 3 is genuinely hard.',
      ].join(' '),
    })
    .arguments({
      language: a.string().required(),
      category: a.string().required(),
      difficulty: a.integer().required(),
    })
    .returns(
      a.customType({
        text: a.string().required(),
        options: a.string().array().required(),
        answer: a.string().required(),
        category: a.string().required(),
        difficulty: a.integer().required(),
      })
    )
    // authenticated, not public: generation costs money per call, and an
    // unauthenticated route is a bill anybody can run up
    .authorization((allow) => allow.authenticated()),

  /**
   * Someone asking how the game works, mid-match.
   *
   * /rules is the long answer; this is the short one -- "what does 2.00x
   * actually pay me", asked at the moment it matters. The system prompt
   * carries the rules that are easy to get wrong rather than all of them.
   *
   * allow.owner() is what keeps one player's conversation their own.
   */
  rulesAssistant: a
    .conversation({
      aiModel: a.ai.model('Claude Sonnet 4.6'),
      systemPrompt: [
        'You answer questions about "Ipak se okrece", a trivia game about elimination. Answer in the language you are asked in, briefly.',
        'THE RULES THAT ARE EASY TO GET WRONG:',
        'A quota is the GROSS return. Stake 100 at 2.00x and you receive 200, so you end up 100 up. Quotas run 1.10 to 2.00, so 2.00 is exactly double and is the ceiling.',
        "The quota comes from the answering player's accuracy in THIS match, so backing the likely outcome pays LESS: against someone answering 80% correctly, betting they are right pays 1.25x.",
        'The stake leaves your wallet immediately and enters the pot. A winning bet is always paid in full, even when the pot cannot cover it.',
        'A duel is a fixed ante of 100 each, capped by the poorer player. Fastest correct answer takes both. On an exact tie the defender wins, not the caller. A lost ante is not charged the usual 100 wrong-answer penalty on top.',
        'A challenge takes no side bets from the table: only the picker stakes, blind, before anyone has seen the question.',
        'Wrong answers cost 100. Reaching zero eliminates you. The last player standing takes whatever is left in the pot.',
        'Never invent a number. If you are unsure of a figure, say so and point them at the rules page.',
      ].join(' '),
    })
    .authorization((allow) => allow.owner()),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // the pool the app already signs people into, via referenceAuth
    defaultAuthorizationMode: 'userPool',
  },
});

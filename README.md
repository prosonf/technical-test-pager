# Technical test - Pager

I chose to write it in Typescript with the [Nest](https://github.com/nestjs/nest) framework and its tools
for quick starting a Nest project.

But bear in mind that this is my first time writing Typescript code and using the Nest framework, so expect
to find things that don't follow some kind of standard of the language or the framework.

The way to see it working is by running the tests.

## Installation
```bash
$ npm install
```

## Test
```bash
$ npm run test
```

## Running the app

The app should start, but there are no controllers or other entry points so there is no chance to interact with
it this way.
```bash
$ npm run start
```
Actually the `EscalationPolicyService` is directly imported in the `PagerModule` instead of importing the
`EscalationPolicyModule` for allowing the application start, as if importing the `EscalationPolicyModule`
an error happens because the service cannot be injected. I didn't look into this further as it is out of the
scope of this exercise.

## Notes about the implementation
Being a quite big system described for an interview, and having taken it easy for writing Typescript and using Nest
for the first time I ended up writing more code and parts that the initially asked for. E.g. I realized in a
post inspection that the code of the `EscalationPolicyService` and its test could have been removed as well.

### About the modelling
The escalation policies data is the best modelled. I realized that I needed it sorted out first just when attempted 
to write the main logic, so it was the first I did and I like it, I don't miss much in it.

The `Issue` data is much worse modelled because in a real case probably it would store much more information
that is not needed to run the basic logic.

So I'm not comfortable with it not storing the alerts triggering the unhealthy status, nor with the issues not being
removed but being overwritten when a new unhealthy status arrives. The decision of no removing them was to mimic
the Repository method for retrieving the open issue for a service -stating that it should be an open issue-.

### About the concurrency
The concurrency in this implementation is very simply kept by the fact that everything is sync and NodeJs will
run only one thread.

Aiming for a more realistic scenario, I commented the methods in the `PagerRepository` that could be transactional
for serializing concurrent events over the same service using a relational DB with ACID transactions.
- The rows would be read blocking that row and updated inside the transaction
- In this case, the `PagerService` service would not hold transactional logic
- The side effects of notifying and setting the timeout are out of the transaction for not holding it during I/O
  - The errors should be dealt apart. Being technical operations, the errors can only be technical and so the fixing operation. E.G sending the notification requests to a queue that could be retried if with failure.
  - If queues was used, producing the message could be kept inside the transaction as it should be fast, and the possible error would be of this service and not of the notification one.
  - This option could be discussed and maybe tested with a load test.
- In this implementation the `acknowledgementTimeout` is not well guarded for concurrency, "trusting" the scheduler not to make concurrent calls on the same service.

Optimistic locking could be used as well instead of transactions.

Another different solution could be using distributed locks to cope with concurrency, e.g. Redis locks.

Another solution for concurrency could be Sagas, but it seems too complex for this case.

const Variable = name =>
  ({ type: 'variable', name });

const Lambda = (parameter, body) =>
  ({ type: 'lambda', parameter, body });

const Apply = (procedure, argument) =>
  ({ type: 'application', procedure, argument });

const v = Variable;
const l = Lambda;
const a = (...exprs) => exprs.reduce(Apply);

const evaluate = (env, expr) => {
  switch (expr.type) {
    case 'variable':
      return env[expr.name]()
    case 'lambda':
      return x =>
        evaluate
          ({ ...env, [expr.parameter]: x }
            , expr.body
          )
    case 'application':
      return evaluate(env, expr.procedure)(_ => evaluate(env, expr.argument))
    default:
      throw Error(`unsupported expression: ${expr}`)
  }
};

const toInt = expr =>
  evaluate({}, expr)(_ => x => x() + 1)(_ => 0);

const toBool = expr =>
  evaluate({}, expr)(_ => true)(_ => false);

// -----------------------------------------------------
const TRUE = l('a', l('b', v('a')));
const FALSE = l('a', l('b', v('b')));
const ISZERO = l('n', a(v('n'), l('x', FALSE), TRUE));

const NEXT =
  l('n', l('f', l('x', a(v('f'), a(v('n'), v('f'), v('x'))))));

const PRE =
  l('n', l('f', l('x', a(
    v('n'),
    l('g', l('h', a(v('h'), a(v('g'), v('f'))))),
    l('u', v('x')),
    l('u', v('u'))
  ))));

const ZERO = l('f', l('x', v('x')));
const PLUS = l('m', l('n', a(v('m'), NEXT, v('n'))));
const MINUS = l('m', l('n', a(v('n'), PRE, v('m'))));
const EXP = l('m', l('n', a(v('n'), v('m'))));
const MULT = l('m', l('n', l('f', a(v('m'), a(v('n'), v('f'))))));

const church = n => n === 0 ? ZERO : a(NEXT, church(n - 1));

const IF = l('p', l('a', l('b', a(v('p'), v('a'), v('b')))));
const AND = l('p', l('q', a(v('p'), v('q'), v('p'))));
const OR = l('p', l('q', a(v('p'), v('p'), v('q'))));
const NOT = l('p', a(v('p'), FALSE, TRUE));
const LEQ = l('m', l('n', a(ISZERO, a(MINUS, v('m'), v('n')))));
const EQ = l('m', l('n', a(AND, a(LEQ, v('m'), v('n')), a(LEQ, v('n'), v('m')))));

const CONS = l('x', l('y', l('p', a(v('p'), v('x'), v('y')))));
const CAR = l('p', a(v('p'), l('x', l('y', v('x')))));
const CDR = l('p', a(v('p'), l('x', l('y', v('y')))));

const Y = l('g', a(
  l('x', a(v('g'), a(v('x'), v('x')))),
  l('x', a(v('g'), a(v('x'), v('x'))))
));

const FACT = l('r', l('n', a(
  a(ISZERO, v('n')),
  church(1),
  a(MULT, v('n'), a(v('r'), a(PRE, v('n'))))
)));

const FIB =
  l('r', l('x', a(
    IF,
    a(LEQ, v('x'), church(1)),
    v('x'),
    a(
      PLUS,
      a(v('r'), a(PRE, v('x'))),
      a(v('r'), a(PRE, a(PRE, v('x'))))
    )
  )));

// tests
const assert = (label, actual, expected) =>
  actual === expected
    ? console.log(label, "=>", actual)
    : console.error(label, "=>", actual, `; expected: ${expected}`);

const assertTrue = (label, actual) =>
  assert(label, actual, true);

const assertFalse = (label, actual) =>
  assert(label, actual, false);

assert
  ("IDENTITY #9"
    , toInt(a(l('x', v('x')), church(9)))
    , 9
  );

assert
  ("NEXT #7"
    , toInt(a(NEXT, church(7)))
    , 8
  );

assertTrue
  ("ISZERO #0"
    , toBool(a(ISZERO, church(0)))
  );

assert
  ("IF TRUE #4 #5"
    , toInt(a(IF, TRUE, church(4), church(5)))
    , 4
  );

assert
  ("IF TRUE #4 #5"
    , toInt(a(IF, FALSE, church(4), church(5)))
    , 5
  );

assert
  ("IF (EQ #3 #3) #4 #5"
    , toInt(a(IF, a(EQ, church(3), church(3)), church(4), church(5)))
    , 4
  );

assertTrue
  ("LEQ #2 #4"
    , toBool(a(LEQ, church(2), church(4)))
  );

assertTrue
  ("LEQ #4 #4"
    , toBool(a(LEQ, church(4), church(4)))
  );

assertFalse
  ("LEQ #5 #4"
    , toBool(a(LEQ, church(5), church(4)))
  );

assertFalse
  ("EQ #3 #4"
    , toBool(a(EQ, church(3), church(4)))
  );

assertTrue
  ("EQ #4 #4"
    , toBool(a(EQ, church(4), church(4)))
  );

assertFalse
  ("EQ #4 #5"
    , toBool(a(EQ, church(4), church(5)))
  );

assert
  ("PLUS #4 #3"
    , toInt(a(PLUS, church(4), church(3)))
    , 7
  );

assert
  ("MINUS #9 #4"
    , toInt(a(MINUS, church(9), church(4)))
    , 5
  );

assert
  ("MULT #3 #5"
    , toInt(a(MULT, church(3), church(5)))
    , 15
  );

assert
  ("EXP #2 #5"
    , toInt(a(EXP, church(2), church(5)))
    , 32
  );

assert
  ("CAR (CONS #1 #2)"
    , toInt(a(CAR, a(CONS, church(1), church(2))))
    , 1
  );

assert
  ("CDR (CONS #1 #2)"
    , toInt(a(CDR, a(CONS, church(1), church(2))))
    , 2
  );

assert
  ("Y FACT #5"
    , toInt(a(Y, FACT, church(5)))
    , 120
  );

assert
  ("Y FIB #10"
    , toInt(a(Y, FIB, church(10)))
    , 55
  );

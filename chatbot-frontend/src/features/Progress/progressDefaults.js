export const emptyProgress = {
  month: { label: '' },
  summary: {
    totalTestsTakenThisMonth: 0,
    mathsScienceAverageScore: 0,
    mathsAverageScore: 0,
    scienceAverageScore: 0,
    totalQuestionsAsked: 0,
    mathsScienceQuestionsAsked: 0
  },
  questions: {
    all: { totalQuestionsAsked: 0, mostAskedChapter: null },
    maths: { totalQuestionsAsked: 0, mostAskedChapter: null },
    science: { totalQuestionsAsked: 0, mostAskedChapter: null }
  },
  testStats: {
    maths: {
      testsTaken: 0,
      averageScore: 0,
      mostTestedChapter: null,
      strongestChapter: null,
      weakestChapter: null
    },
    science: {
      testsTaken: 0,
      averageScore: 0,
      mostTestedChapter: null,
      strongestChapter: null,
      weakestChapter: null
    }
  },
  recentTests: []
};

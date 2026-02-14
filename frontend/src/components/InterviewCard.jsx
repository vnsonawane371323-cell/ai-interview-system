import { Link } from 'react-router-dom';

const InterviewCard = ({ interview }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScoreColor = (score) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-blue-100 text-blue-700';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getCategoryBadge = (category) => {
    const colors = {
      technical: 'bg-purple-100 text-purple-700',
      behavioral: 'bg-blue-100 text-blue-700',
      'system-design': 'bg-indigo-100 text-indigo-700',
      general: 'bg-gray-100 text-gray-700',
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span
              className={`text-xs px-2 py-1 rounded-full font-medium ${getCategoryBadge(
                interview.category
              )}`}
            >
              {interview.category}
            </span>
            <span className="text-xs text-gray-500">
              {interview.difficulty}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {interview.question}
          </h3>
        </div>
        
        {interview.score !== null && interview.score !== undefined && (
          <div
            className={`ml-4 px-4 py-2 rounded-lg font-bold text-lg ${getScoreColor(
              interview.score
            )}`}
          >
            {interview.score}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
        {interview.answer}
      </p>

      {interview.aiFeedback && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-3 mb-4">
          <p className="text-xs text-blue-900 line-clamp-2">
            <span className="font-semibold">AI Feedback: </span>
            {interview.aiFeedback}
          </p>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          {formatDate(interview.createdAt)}
        </span>
        <Link
          to={`/interview/${interview._id}`}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
};

export default InterviewCard;

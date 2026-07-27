/** maps Amplify/Cognito auth errors to translation keys so users see a
 *  friendly message instead of e.g. "NotAuthorizedException: ..." */
export function authErrorKey(err: unknown): string {
  const name = (err as { name?: string })?.name ?? '';
  switch (name) {
    case 'UsernameExistsException':
      return 'authError.usernameTaken';
    case 'InvalidPasswordException':
      return 'authError.passwordWeak';
    case 'InvalidParameterException':
      return 'authError.invalidInput';
    case 'NotAuthorizedException':
    case 'UserNotFoundException':
      return 'authError.wrongCredentials';
    case 'UserNotConfirmedException':
      return 'authError.notConfirmed';
    case 'CodeMismatchException':
      return 'authError.codeWrong';
    case 'ExpiredCodeException':
      return 'authError.codeExpired';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return 'authError.tooMany';
    default:
      return 'authError.generic';
  }
}

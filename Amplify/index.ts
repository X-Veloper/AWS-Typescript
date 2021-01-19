
import Amplify, { API, graphqlOperation } from 'aws-amplify'
import awsconfig from './aws-exports'

Amplify.configure(awsconfig);

export default Amplify
export { API, graphqlOperation }
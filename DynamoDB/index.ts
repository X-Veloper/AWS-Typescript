// import * as AWS from 'aws-sdk'
import AWS, { nanoid } from '../aws'


import { PROJECT_KEYS, QUERY, QUERY_SORT, QUERY_BETWEEN, QUERY_INDEX, QUERY_INDEX_SORT, PUT, UPDATE_SORT, SCAN, SCAN_ALL } from './types.d'



const client: AWS.DynamoDB.Types.DocumentClient = new AWS.DynamoDB.DocumentClient()

export const scan = async (fn: SCAN) => {
  let params: any = {
    TableName: fn.tableName,
  }
  // if (exc !== '') params['ExclusiveStartKey'] = exc
  // if (filter !== '') {
  //   params['FilterExpression'] = filter.key + ' = :FILDATA'
  //   params['ExpressionAttributeValues'] = { ":FILDATA": filter.data }
  // }
  return new Promise(resolve => {
    client.scan(params, function (err, data) {
      if (err) console.log(err)
      else resolve(data.Items)
    })
  })
}

export const scanAll = async (fn: SCAN_ALL) => {
  return new Promise(async resolve => {
    let list = []
    let res: any = await scan(fn)
    list.push(...res.Items)
    while ("LastEvaluatedKey" in res) {
      res = await scan(fn)
      list.push(...res.Items)
    }
    resolve(list)
  })
}

export const put = async ({ tableName, item }: PUT) => {
  const params = {
    TableName: tableName,
    Item: item
  }
  return new Promise(resolve => {
    client.put(params, function (err, data) {
      if (err) {
        console.log(err);
        resolve({ status: 400 })
      }
      else resolve({ status: 200 })
    })
  })
}


export const query = async (fn: QUERY) => {
  let params: any = {
    TableName: fn.tableName,
    KeyConditionExpression: "#ID = :ID",
    ExpressionAttributeNames: {
      "#ID": fn.pk
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv
    }
  }

  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve([])
      }
      resolve(data.Items)
    })
  })
}

const generateKeyProjection = (item: any) => (item ? item.reduce((sum: any, cur: any) => ({ ...sum, ['#' + nanoid()]: cur }), {}) : null)


export const querySort = async (fn: QUERY_SORT) => {
  const expName: AWS.DynamoDB.ExpressionAttributeNameMap = generateKeyProjection(fn.project)
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    KeyConditionExpression: "#ID = :ID and #SK = :SK  ",
    ExpressionAttributeNames: {
      "#ID": fn.pk,
      "#SK": fn.sk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv,
      ":SK": fn.sv
    },
    ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve([])
      }
      resolve(data.Items)
    })
  })
}

export const queryBetween = async (fn: QUERY_BETWEEN) => {
  const expName: AWS.DynamoDB.ExpressionAttributeNameMap = generateKeyProjection(fn.project)
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    KeyConditionExpression: "#ID = :ID and #SK between :BGW and :END",
    ExpressionAttributeNames: {
      "#ID": fn.pk,
      "#SK": fn.sk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv,
      ":BGW": fn.start,
      ":END": fn.end,
    },
    ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve([])
      }
      resolve(data.Items)
    })
  })
}

export const queryIndex = async (fn: QUERY_INDEX) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  if (fn.project) expName = generateKeyProjection(fn.project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    IndexName: fn.indexName,
    KeyConditionExpression: "#ID = :ID",
    ExpressionAttributeNames: {
      "#ID": fn.pk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv
    },
    ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve([])
      }
      resolve(data.Items)
    })
  })
}

export const queryIndexSort = async (fn: QUERY_INDEX_SORT) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  if (fn.project) expName = generateKeyProjection(fn.project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    IndexName: fn.indexName,
    KeyConditionExpression: "#ID = :ID and #SK = :SK",
    ExpressionAttributeNames: {
      "#ID": fn.pk,
      "#SK": fn.sk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv,
      ":SK": fn.sv
    },
    ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve([])
      }
      resolve(data.Items)
    })
  })
}


export const updateSort = async (fn: UPDATE_SORT) => {
  let _item = Object.assign({}, fn.item);

  const keys = Object.keys(_item)
  const _ExpressionAttributeNames = keys.reduce((ac, a) => ({ ...ac, ['#' + a.replace('-', '')]: a }), {})
  const _ExpressionAttributeValues = keys.reduce((ac, a) => ({ ...ac, [':' + a.replace('-', '')]: _item[a] }), {})
  let _UpdateExpression = 'set '
  keys.reduce((_, a) => (_UpdateExpression += ('#' + a.replace('-', '') + ' = :' + a.replace('-', '') + ', ')), {})

  const params = {
    TableName: fn.tableName,
    Key: { [fn.pk]: fn.pv, [fn.sk]: fn.sv },
    UpdateExpression: _UpdateExpression.slice(0, -2),
    ExpressionAttributeNames: _ExpressionAttributeNames,
    ExpressionAttributeValues: _ExpressionAttributeValues
  }

  return new Promise<{}>(resolve => {
    client.update(params, (err, data) => {
      if (err) {
        console.log(err);
        resolve({ success: true })
      }
      resolve({ success: true })
    })
  })
}
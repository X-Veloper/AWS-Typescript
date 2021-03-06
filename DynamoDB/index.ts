// import * as AWS from 'aws-sdk'
import AWS, { nanoid } from '../aws'


import type { SCAN_BETWEEN, PROJECT_KEYS, QUERY, QUERY_SORT, QUERY_BETWEEN, QUERY_INDEX, QUERY_INDEX_SORT, PUT, UPDATE_SORT, SCAN, QUERY_INDEX_CONTAIN, UPDATE_LIST, UPDATE } from './index.d'

const client: AWS.DynamoDB.Types.DocumentClient = new AWS.DynamoDB.DocumentClient()

const isEmpty = (item) => (item === undefined || item === null)
const generateKeyProjection = (item: any) => (item ? item.reduce((sum: any, cur: any) => ({ ...sum, ['#' + nanoid()]: cur }), {}) : null)

export const scan = async (fn: SCAN) => {
  let params: any = {
    TableName: fn.tableName,
    ScanIndexForward: false,
  }
  if (fn.lastEvaluatedKey) params['ExclusiveStartKey'] = fn.lastEvaluatedKey
  // if (filter !== '') {
  //   params['FilterExpression'] = filter.key + ' = :FILDATA'
  //   params['ExpressionAttributeValues'] = { ":FILDATA": filter.data }
  // }//
  return new Promise(resolve => {
    client.scan(params, function (err, data) {
      if (err) console.log(err)
      else fn.lastEvaluatedKey ? resolve(data) : resolve(data.Items)
    })
  })
}

export const scanBetween = async(fn: SCAN_BETWEEN) => {
  let params: any = {
    TableName: fn.tableName,
    ConsistentRead: false,
    FilterExpression: "#a5a00 BETWEEN :a5a00 AND :a5a01",
    ExpressionAttributeValues: {
      ":a5a00": fn.start,
      ":a5a01": fn.end
    },
    ExpressionAttributeNames: {
      "#a5a00": fn.key
    }
  }
  return new Promise(resolve => {
    client.scan(params, function (err, data) {
      if (err) console.log(err)
      else resolve(data)
    })
  })
}

export const scanAll = async (fn: SCAN) => {
  const _scan = async (tableName: string, segment: any) => {
    let params: any = {
      TableName: tableName,
      ScanIndexForward: false,
      Segment: segment,
      TotalSegments: 50
      // ExclusiveStartKey: fn.lastEvaluatedKey
    }
    return new Promise(resolve => {
      client.scan(params, function (err, data) {
        if (err) console.log(err)
        else resolve(data.Items)
      })
    })
  }
  return new Promise(async resolve => {
    let res: any = await Promise.all([...Array(50)].map((item, index) => _scan(fn.tableName, index)))
    const data = res.reduce((sum: any, cur: any) => (sum.concat(cur)), [])
    resolve(data)
  })
}

export const put = async ({ tableName, item, key = "PK" }: PUT) => {
  const params: AWS.DynamoDB.DocumentClient.PutItemInput = {
    TableName: tableName,
    Item: item,
    ExpressionAttributeNames: { "#cd420": key },
    ConditionExpression: "attribute_not_exists(#cd420)"
  }
  return new Promise((resolve, reject) => {
    client.put(params, (err, data) => {
      if (err) {
        // console.log('error :', err)
        reject({ status: 400 })
      }
      else resolve({ status: 200 })
    })
  })
}
export const updateSortAdd = (_table, _keyname, _keyid, _sortname, _sortid, _addKey, _addValue) => {
  const params = {
      TableName: _table,
      Key: { [_keyname]: _keyid, [_sortname]: _sortid },
      UpdateExpression: "ADD #key :value",
      ExpressionAttributeNames: {
          '#key': _addKey
      },
      ExpressionAttributeValues: {
          ':value': _addValue
      },
      ReturnValues: 'UPDATED_NEW'
  }
  return new Promise(reslove => {
    client.update(params, function (err, data) {
          if (err)
              console.log("Error", err)
          else reslove(data.Attributes[_addKey])
          console.log(data);
      })
  })
}
export const updateList = async (fn: UPDATE_LIST) => {
  const params: AWS.DynamoDB.DocumentClient.UpdateItemInput = {
    TableName: fn.tableName,
    Key: {
      [fn.pk]: fn.pv
    },
    ExpressionAttributeNames: {
      "#data": fn.updateKey
    },
    ExpressionAttributeValues: {
      ":data": [fn.updateValue]
    },
    UpdateExpression: "SET #data = list_append(#data, :data)"
  }
  return new Promise(resolve => {
    client.update(params, (err, data) => {
      if (err) {
        console.log('error :', err)
        resolve({ status: 400 })
      }
      else resolve({ status: 200 })
    })
  })
}

export const update = async (fn: UPDATE) => {
  // console.log(item);

  let _item = Object.assign({}, fn.item)

  const keys = Object.keys(_item)
  const _ExpressionAttributeNames = keys.reduce((ac, a) => ({ ...ac, ['#' + a]: a }), {})
  const _ExpressionAttributeValues = keys.reduce((ac, a) => ({ ...ac, [':' + a]: _item[a] }), {})
  let _UpdateExpression = 'set '
  keys.reduce((_, a) => (_UpdateExpression += ('#' + a + ' = :' + a + ', ')), {})

  const params = {
    TableName: fn.tableName,
    Key: { [fn.pk]: fn.pv },
    UpdateExpression: _UpdateExpression.slice(0, -2),
    ExpressionAttributeNames: _ExpressionAttributeNames,
    ExpressionAttributeValues: _ExpressionAttributeValues
  }
  //   console.log(params);

  return new Promise(reslove => {
    client.update(params, function (err, data) {
      if (err) {
        console.log("Error", err)
        // alert(JSON.stringify(err))
      }
      else reslove('success')
    })
  })
}


export const query = async (fn: QUERY) => {
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    ScanIndexForward: false,
    KeyConditionExpression: "#ID = :ID",
    ExpressionAttributeNames: {
      "#ID": fn.pk
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv
    },
    Limit: fn.limit
  }

  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      resolve(data.Items)
    })
  })
}
export const advanceQuerySortIndex = async (tableName: string, indexName: string, pk: string, pv: string, sk: string, sv: string | string[], so = '=', option?) => {
  // let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  // if (project) expName = generateKeyProjection(project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: tableName,
    IndexName: indexName,
    ScanIndexForward: false,
    KeyConditionExpression: `#ID = :ID and #SK ${so} :SK`,
    ExpressionAttributeNames: {
      "#ID": pk,
      "#SK": sk
    },
    ExpressionAttributeValues: {
      ":ID": pv,
      ":SK": sv
    },
    ...option,
    // ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
    // Limit: 100
  }
  Object.keys(params).forEach(key => isEmpty(params[key]) && delete params[key])
  // console.log(params);

  return new Promise<any>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      // console.log(data);

      resolve(data)
    })
  })
}
export const querySort = async (fn: QUERY_SORT) => {
  const expName: AWS.DynamoDB.ExpressionAttributeNameMap = generateKeyProjection(fn.project)
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    ScanIndexForward: false,
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
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      resolve(data.Items)
    })
  })
}
export const queryBeginWith = async (fn: QUERY_SORT) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  if (fn.project) expName = generateKeyProjection(fn.project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    ScanIndexForward: false,
    KeyConditionExpression: "#ID = :ID and begins_with(#SK,:SK)",
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
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
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
    ScanIndexForward: false,
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
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      resolve(data.Items)
    })
  })
}
export const advanceQueryIndex = async (tableName: string, indexName: string, pk: string, pv: string, option?) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  // if (project) expName = generateKeyProjection(project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: tableName,
    IndexName: indexName,
    ScanIndexForward: false,
    KeyConditionExpression: "#ID = :ID",
    ExpressionAttributeNames: {
      "#ID": pk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": pv
    },
    ...option,
    // ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
    // Limit: 100
  }
  Object.keys(params).forEach(key => isEmpty(params[key]) && delete params[key])
  // console.log(params);

  return new Promise<any>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      // console.log(data);

      resolve(data)
    })
  })
}
export const queryIndex = async (fn: QUERY_INDEX) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  if (fn.project) expName = generateKeyProjection(fn.project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    IndexName: fn.indexName,
    ScanIndexForward: false,
    KeyConditionExpression: "#ID = :ID",
    ExpressionAttributeNames: {
      "#ID": fn.pk,
      ...expName
    },
    ExpressionAttributeValues: {
      ":ID": fn.pv
    },
    ProjectionExpression: fn.project ? Object.keys(expName).join() : null,
    Limit: fn.limit
  }

  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      // console.log(data);

      resolve(data.Items)
    })
  })
}
export const queryIndexBeginWith = async (fn: QUERY_INDEX_SORT) => {
  let expName: AWS.DynamoDB.ExpressionAttributeNameMap
  if (fn.project) expName = generateKeyProjection(fn.project)

  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    IndexName: fn.indexName,
    ScanIndexForward: false,
    KeyConditionExpression: "#ID = :ID and begins_with(#SK,:SK)",
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
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
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
    ScanIndexForward: false,
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
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      resolve(data.Items)
    })
  })
}

export const queryIndexContains = async (fn: QUERY_INDEX_CONTAIN) => {
  let params: AWS.DynamoDB.DocumentClient.QueryInput = {
    TableName: fn.tableName,
    IndexName: fn.indexName,
    ScanIndexForward: false,
    KeyConditionExpression: "#82890 = :82890",
    FilterExpression: "contains(#82891, :82891)",
    ExpressionAttributeNames: {
      "#82890": fn.pk,
      "#82891": fn.keywordKey
    },
    ExpressionAttributeValues: {
      ":82890": fn.pv,
      ":82891": fn.keywordValue
    },
    Limit: fn.limit
  }
  return new Promise<any[]>(resolve => {
    client.query(params, (err, data) => {
      if (err) {
        console.log(err)
        resolve([])
      }
      resolve(data.Items)
    })
  })
}


export const updateSort = async (fn: UPDATE_SORT) => {
  let _item = Object.assign({}, fn.item)

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
        console.log(err)
        resolve({ success: true })
      }
      resolve({ success: true })
    })
  })
}
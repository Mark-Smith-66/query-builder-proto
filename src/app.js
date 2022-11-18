import { LightningElement, track } from "lwc";
import traitmeta from './traitdata'

export default class App extends LightningElement {
  @track savedQuery// = {"operator":"INTERSECT","value":[{"operator":"EQUALS","trait":"DTV_HH_DEMO_HH_AGE_1824","trait_id":1197,"values":[{"value":"YES","value_id":"145581"}]},{"operator":"IN","trait":"DTV_HH_DEMO_ETHNICITY","trait_id":1719,"values":[{"value":"AFRICAN AMERICAN","value_id":"74323"},{"value":"ASIAN","value_id":"157506"},{"value":"HISPANIC","value_id":"92067"},{"value":"WHITE","value_id":"145378"}]},{"operator":"INTERSECT","value":[{"operator":"EQUALS","trait":"DTV_HH_DEMO_AARP_MODEL","trait_id":1087,"values":[{"value":"SOMEWHAT LIKELY","value_id":"127419"}]},{"operator":"NOT IN","trait":"TV_VIEWERSHIP_CONSUMPTION_BIG_5","trait_id":1843,"values":[{"value":"1-5","value_id":"521829340"},{"value":"16-20","value_id":"81980"}]}]}]}
  @track countsQuery
  @track counts;
  @track _query = {} // likely @api

  // Reconstitue a (passed in) query to our internal structure
  // Looks like: 
  /*
    { 
        id: 'root' for top level group || uuid,
        isGroup: <true|false>, 
        operator: <rule or group operator>
        data: present if group - <array of child groups/rules all following this structure>
        parentId: <id of parent - if not root group>,
        trait: present if not group - <trait meta object>
        value: present if not group - <array of selected trait values>.
        level: how many nesting levels deep we are
    }

    Trait Meta Object looks like this:
    {
      "ALIAS": ...,
      "ALLOWED_GROUP": ...,
      "ALLOWED_TENANT": ...,
      "CATEGORY": ...,
      "SUB_CATEGORY": ...,
      "TRAIT": ...,
      "TRAIT_ID": ...,
      "VALUE_TYPE": ...,
      "VAL_OPTS": string of pipe separated value/valueid pairs - each pair separated by a '^'
                  ex: "HEAVY^92037|MEDIUM^121351|LIGHT^175065"
    },
  */
  constructor() {
    super()
    this._query  = this.reconstitute()
  }

  // Getter/Setter for internal Query JSON
  get query() {
    return this._query
  }
  set query(query) {
    this._query = query
  }

  // Gets Local Mock Traits
  get traitmetadata() {
    return traitmeta;
  }

  // Reconsititue saved query
  reconstitute = (g, pid) => {
    let obj
    if (!g) {
      obj = {
        id: 'root', 
        isGroup: true,
        operator: 'INTERSECT',
        data: [],
        level: 0
      }
      if (this.savedQuery) {
        obj.op = this.savedQuery.operator
        this.savedQuery.value.forEach(v => {
          obj.data.push(this.reconstitute(v, obj.id))
        })
      }
    } else {
      if (g.value) {
        obj = {
          id: this.getuuid(),
          parentId: pid,
          isGroup: true,
          operator: g.operator,
          level: g.level++,
          data: []
        }
        
        g.value.forEach(v => {
          obj.data.push(this.reconstitute(v, obj.id))
        })
    } else {
      obj = {
        id: this.getuuid(),
        parentId: pid,
        isGroup: false,
        operator: g.operator,
        value: g.values.map(v => `${v.value}^${v.value_id}`),
        trait: traitmeta.find(t => t.TRAIT_ID === g.trait_id),
        level: g.level + 1
      }
    }
  }
    
    return obj
  }

  // Generate unique id
  // Crude - can substitute with anything better
  getuuid() {
    return 'xxxx-xxxx-xxx-xxxx'.replace(/[x]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  // Find group by ID
  findGroup = (q, id) => {
    // If not a group - ignore
    if (!q.isGroup) return undefined;

    // If this group - return
    if (q.id === id) return q

    // If child of this group - return
    let rg = q.data.filter(d => d.id === id)
    if (rg.length === 1) return rg[0]

    let fgrp
    q.data.forEach(g => {
      // Recursively find in children 
      let fnd = this.findGroup(g, id)
      if (fnd) fgrp = fnd
    })

    return fgrp
  }
  
  // Handle Add Rule Group Event
  addRuleGroup = (e) =>  {
    const pid = e.detail
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find Parent Group to add to
    let group = this.findGroup(newQuery, pid)
    if (group) {
      // If parent found - add new group
      let rid = this.getuuid()
      this.scrollElID = rid;

      group.data.push({
        parentId: pid,
        id: rid,
        isGroup: true,
        operator: 'INTERSECT',
        data: [],
        level: group.level + 1
      })
      
      // replace query
      this._query = newQuery
    }
  }

  // Handle Delete Rule Group Event
  deleteRuleGroup = (e) => {
    const id = e.detail.id
    const pid = e.detail.pid
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find Parent Group to delete from
    let group = this.findGroup(newQuery, pid)
    if (group) {
      // If parent found - remove group from parent
      let idx = group.data.findIndex(e => e.id === id)
      if (idx !== -1) group.data.splice(idx, 1)

      // replace query
      this._query = newQuery
    }
  }

  // Handle Add Rule Event
  addRule = (e) => {
    const pid = e.detail
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find Parent Group to add to
    let group = this.findGroup(newQuery, pid)
    if (group) {
      // If parent found - add new rule
      let rid = this.getuuid()
      this.scrollElID = rid;

      group.data.push({
        parentId: pid,
        id: rid,
        isGroup: false,
        operator: null,
        value: null,
        trait: null,
        level: group.level + 1
      })

      // replace query
      this._query = newQuery
    }
  }

  // Handle Move a Rule/Group to a new position
  moveRule = (e) => {
    const gid = e.detail.groupId
    const id = e.detail.id

    // Group/Position to move to 
    let toIndex = e.detail.moveIndex
    const toGroup = e.detail.moveGroupId

    // Find Parent Group to add to
    let newQuery = JSON.parse(JSON.stringify(this._query))
    let group = this.findGroup(newQuery, gid)
    if (group) {
      // Get current position in parent group
      let fromIndex = group.data.findIndex(e => e.id === id)
      if (fromIndex !== -1) {
        
        // Adjust toIndex to base 0
        if (toIndex > fromIndex && gid == toGroup) toIndex = toIndex - 1;
        
        // Remove element from existing group
        //console.log(`move ${id} from ${fromIndex} in ${gid} to ${toIndex} in ${toGroup}`)
        const element = group.data.splice(fromIndex, 1)[0]; 
        
        // Find new group to move to
        let moveGroup = this.findGroup(newQuery, toGroup)
        if (moveGroup) {
          // Change element parent to new group
          // and add to new position
          element.parentId = toGroup;
          element.level = moveGroup.level + 1
          moveGroup.data.splice(toIndex, 0, element);
        }
        
        // replace query
        this._query = newQuery
      }
    }

  }
  
  // Handle Delete Rule event
  deleteRule = (e) => {
    const gid = e.detail.gid
    const id = e.detail.id
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find Group to delete from
    let group = this.findGroup(newQuery, gid)
    if (group) {
      // If group found, delete rule from group
      let idx = group.data.findIndex(e => e.id === id)
      if (idx !== -1) group.data.splice(idx, 1)

      // replace query
      this._query = newQuery
    }
  }

  // Handle Add Trait to Rule Event
  addTraitToRule = (e) => {
    const gid = e.detail.groupId;
    const id = e.detail.id;
    const trait = e.detail.trait;
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find parent Group for Rule
    let group = this.findGroup(newQuery, gid);
    if (group) {
      // Find Rule in parent Group
      let rule = group.data.find(r => r.id === id)
      if (rule) {
        // Add trait data to rule
        rule.trait = trait

        const traitVals = trait.VAL_OPTS.split('|')

        // Default operator/value if only a single
        // value can be chosen for trait
        if (traitVals.length === 1) {
          rule.operator = 'EQUALS'
          rule.value = [traitVals[0]]
        }

        // replace query
        this._query = newQuery
      }
    }
  }
  
  // Handle Rule Operator Change
  operatorChange = (e) => {
    const gid = e.detail.groupId;
    const id = e.detail.id;
    const val = e.detail.val;
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find Group 
    let group = this.findGroup(newQuery, gid);
    if (group) {
      // If Rule Operator
      if (id) {
        // Find Rule in Group
        let rule = group.data.find(r => r.id === id)
        if (rule) {
          // If Rule operator changes from single to multi (or visa versa)
          // delete any previously selected values for rule
          const isMulti = rule.operator && rule.operator.indexOf('IN') !== -1
          const willBeMulti = val.indexOf('IN') !== -1
          if (isMulti !== willBeMulti) {
            rule.value = null
          }
          
          // Set the rule operator
          rule.operator = val
        }
      }
      else {
        // Group operator/condition. Set on group
        group.operator = val
      }
      
      // replace query
      this._query = newQuery
    }
  }

  // Handle Rule Value change
  ruleValueChange = (e) => {
    const gid = e.detail.groupId;
    const id = e.detail.id;
    const val = e.detail.val;
    let newQuery = JSON.parse(JSON.stringify(this._query))

    // Find parent group
    let group = this.findGroup(newQuery, gid);
    if (group) {
      // Find rule in group
      let rule = group.data.find(r => r.id === id)
      if (rule) {
        // Replace empty value with null or use selected value(s)
        rule.value = val.length > 0 && val[0] !== '' ? val : null
        this._query = newQuery
      }
    }

  }

  // Return True if query is missing data
  isInvalidQuery(qs) {
    let invalid = false

    // Root group with no data is invalid
    if (qs.isGroup && qs.id !== 'root' && qs.data.length === 0) invalid = true
    else if (qs.isGroup) {
      // Check each child for validity
      qs.data.some(d => {
        invalid = this.isInvalidQuery(d)
        if (invalid === true) return true
      })
    } else {
      // Check Rule for validity
      // Must have a trait/operator and value present
      if (!qs.trait || !qs.operator || !qs.value) invalid = true
    }
    return invalid
  }

  // Get class for query box based on query validity
  get queryBoxClass() {
    const invalid = this.isInvalidQuery(this._query)
    return invalid ? 'slds-card query-box invalid' : 'slds-card query-box'
  }

  // Getter for if query is missing data
  get invalidQuery() {
    return this.isInvalidQuery(this._query)
  }

  // Counts disabled if to query data or query is invalid
  get isCountsDisabled() {
    const isDisabled =  this._query.data.length === 0 || this.invalidQuery 
    return isDisabled
  }

  // Save is disabled if query is invalid or saved
  get isSaveDisabled() {
    if (this.isCountsDisabled) return true;

    const apiQuery = JSON.stringify(this.getQueryJSON())
    return this.savedQuery === apiQuery
  }

  // Only show counts if counts are present and they are calculated
  // for the current query
  get hasCounts() {
    return this.counts && !this.isCountsDisabled && (this.counts && JSON.stringify(this._query) === this.countsQuery)
  }

  // This could be refactored to a small component
  // so that we could style via css classes
  get noCountsText() {
    if (this.invalidQuery) {
      return '<span style="color: #ff1744">&lt;Invalid Query&gt;</span>'
    }

    return '<span>&lt;Not Calculated&gt;</span>'
  }

  // Get Counts for Query
  getCounts = () => {
    const apiQuery = JSON.stringify(this.getQueryJSON())
    this.countsQuery = JSON.stringify(this._query)
    //console.log(apiQuery)
    //console.log(this.countsQuery)
    alert(apiQuery)
    this.counts =  [
       { name: 'DTV_ADDRESSABLE', cnt:  parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'DTV_STB_AAF', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'DTV_STB_VOD_ENABLED', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'DTV_STB_VOD', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'OV_ANY', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'OV_CTV', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'OV_AAF', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'OV_MOBILE', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()},
       { name: 'OV_PC', cnt: parseInt(`${Math.random() * 100000}`, 10).toLocaleString()}
    ]
  }

  // Get Query JSON 
  getQueryJSON = (qs = this._query) => {
    let jq = {}
    if (qs.isGroup) {
      jq = {
        operator: qs.operator,
        value: []
      }
      qs.data.forEach(r => {
        jq.value.push(this.getQueryJSON(r))
      })
    } else if (qs.trait ) {

      jq = {
        operator: qs.operator,
        trait: qs.trait.TRAIT,
        trait_id: qs.trait.TRAIT_ID,
        values: qs.value.map(v => {
          const vPair = v.split('^')
          return {
            value: vPair[0],
            value_id: vPair[1]
          }
        })
      }
    }

    return jq
  }
}

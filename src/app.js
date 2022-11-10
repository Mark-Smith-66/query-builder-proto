import { LightningElement, track } from "lwc";

export default class App extends LightningElement {
  @track _query = {
    id: 'root', 
    isGroup: true,
    operator: 'AND',
    data: [],
  }
  @track countsQuery;
  @track counts;

  colors = {
    err: '#ff1744',
    rule: '#21528c',
    operator: '#7a267b'
  }

  // Getter/Setter for internal Query JSON
  get query() {
    return this._query
  }
  set query(query) {
    this._query = query
  }

  // Generate unique id
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
      group.data.push({
        parentId: pid,
        id: rid,
        isGroup: true,
        operator: 'AND',
        data: [],
        idx: group.data.length,
        odd: !group.odd ? true : false
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
      group.data.push({
        parentId: pid,
        id: rid,
        isGroup: false,
        operator: null,
        values: null,
        trait: null,
        idx: group.data.length
      })

      // replace query
      this._query = newQuery
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
          rule.operator = '='
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

  // Helper function to map style object to string
  mapStyle = (s) => {
    let str = ''
    const earr = Object.entries(s)
    let i = 0
    for (const entry of earr) {
      str += `${entry[0]}: ${entry[1]}`
      if (i++ < earr.length - 1) str += ';'
    }
    return str
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

  get queryBoxClass() {
    const invalid = this.isInvalidQuery(this._query)
    return invalid ? 'slds-card query-box invalid' : 'slds-card query-box'
  }

  // Getter for if query is missing data
  get invalidQuery() {
    return this.isInvalidQuery(this._query)
  }

  // Counts disabled if to query data or query is invalid
  get disableCounts() {
    const isDisabled =  this._query.data.length === 0 || this.invalidQuery 
    return isDisabled
  }

  // Return the parsed Human-Readable Query
  get readableQuery() {
    let s = this.parseQuery(this._query)
    return s
  }

  // Only show counts if counts are present and they are calculated
  // for the current query
  get hasCounts() {
    return this.counts && !this.disableCounts && (this.counts && JSON.stringify(this._query) === this.countsQuery)
  }

  get noCountsText() {
    if (this.invalidQuery) {
      return '<span style="color: #ff1744">&lt;Invalid Query&gt;</span>'
    }

    return '<span>&lt;Not Calculated&gt;</span>'
  }

  // Get Counts for Query
  getCounts = () => {
    const apiQuery = this.getQueryJSON()
    this.countsQuery = JSON.stringify(this._query)
    alert(JSON.stringify(apiQuery))
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

  
  // TODO: Proper name/value mapping as needed by Data API
  mapOperator = (o) => {
    return o;
  }

  // Get Query JSON 
  getQueryJSON = (qs = this._query) => {
    let jq = {}
    if (qs.isGroup) {
      jq = {
        operator: this.mapOperator(qs.operator),
        value: []
      }
      qs.data.forEach(r => {
        jq.value.push(this.getQueryJSON(r))
      })
    } else {
      jq = {
        operator: this.mapOperator(qs.operator),
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

  // Parse query JSON to html string
  // This is quick and dirty 0 subject to change
  parseQuery = (qs = query, lvl = 0) => {
    let s = ''

    // Object parsed is a Group
    if (qs.isGroup) {
      // Indent Group level
      let groupStyle = {
        paddingLeft: `${lvl * 4}px`
      }
      
      // Sub-Groups from root begin on new line with a left-paren
      if (qs.id !== 'root') {
        lvl++
        s += `<div style="${groupStyle.toString}">(`
      }

      // Parse Children
      qs.data.forEach((r, idx) => {
        // Children are indented slightly from parent
        let ruleStyle = {
          color: this.colors.rule,
          'padding-left': `${lvl * 6}px`
        }
        
        // Each child begins on a new line - indented from parent
        s += `<div style="${this.mapStyle(ruleStyle)}">`
      
        // Parse the child, w/ new level
        s +=  this.parseQuery(r, lvl)

        // Separate any children with Group Operator
        // Note: Operator omitted if only one child exists
        if (idx < qs.data.length - 1) {
          s += ` <b style="color:${this.colors.operator}">${qs.operator}</b> `
        }
        s += '</div>'
      })

      // If Group has no children - add missing text
      if (qs.data.length === 0) {
        s += `<span style="color:${this.colors.err}">No Rules${
          qs.id !== 'root' ? ' in Group' : ''
        }</span>`
      }
      
      // Add end paren for sub-group
      // Note: there are no parens for the root group
      s += qs.id === 'root' ? '' : ')</div>'
    } else {
      // Object Parsed is a Rule
      if (qs.trait) {

        // If trait present - add
        // <alias> <operator> <values>
        
        // Output trait alias
        s += qs.trait.ALIAS + ' '

        // Output Operator or missing operator text if not present
        s += qs.operator
          ? ` <span style="">${qs.operator}</span> `
          : ` <span style="color:${this.colors.err}">&lt;missing operator&gt;</span> `
        
        // IN/NOT IN operators have values surrounded by parens
        let isInClause = qs.operator && qs.operator.indexOf('IN') !== -1
        if (isInClause) s += '('

        // Output Selected Values
        if (qs.value) {

          // Comma separate each selected value
          // Note: comma omitted if only a single value is selected
          qs.value.forEach((v, i) => {
            const rv = v.split('^')
            s += i > 0 ? ', ' : ''
            s += rv[0]
          })
        } else {
          // No values present - output missing values text
          s += ` <span style="color:${this.colors.err}">&lt;missing value&gt;</span> `
        }

        // end paren for IN/NOT IN Operators
        if (isInClause) s += ')'
      } else {
        // Missing trait - output missing trait text
        s += ` <span style="color:${this.err}">&lt;missing trait&gt;</span> `
      }
    }
    return s
  }
}

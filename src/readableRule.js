import { LightningElement, api, track } from "lwc";

export default class ReadableRule extends LightningElement {
  @api rule
  @api parent

  get emptyRule() {
    return !this.rule.trait;
  }

  get ruleClass() {
    return this.rule.parentId === 'root' ? 'rule root' : 'rule'
  }

  get operatorClass() {
    return !this.emptyRule && this.rule.operator ? 'operator' : 'error'
  }
  
  get valueClass() {
    return !this.emptyRule && this.rule.value ? '' : 'error'
  }

  get operator() {
    let op = this.mapOperator(this.rule.operator)
    return op || '<missing operator>'
  }

   // True if Rule has following sibling
  get hasNextSibling() {
    let idx = this.parent.data.findIndex(o => o.id === this.rule.id)
    return idx !== -1 && idx < this.parent.data.length -1
  }
  
  get groupOperator() { 
    if (this.hasNextSibling) {
      return this.mapOperator(this.parent.operator)
    }
    return ''
  }

  get values() {
    if (!this.rule.value) return '<missing values>'
    return  this.rule.value.map((v, i) => {
            const rv = v.split('^')
            return rv[0]
          }).join(', ')
  }

  // TODO: Proper name/value mapping as needed by Data API
  mapOperator = (o) => {
    let op = o;
    if (o === 'INTERSECT') op = 'AND';
    else if (o === 'UNION') op = 'OR';
    else if (o === 'MINUS') op = 'SUBTRACT';
    else if (o === 'EQUALS') op = '=';
    else if (o === 'NOT') op = '!=';
    
    return op;
  }
  
  /*
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

  get hasQuery() {
    return this.query.data.length > 0
  }
  parseQuery2 = (qs = query, lvl = 0, grp) => {
    if (qs.isGroup) {
      console.log(`${qs.id} num c: ${qs.data.length}`)
      grp = {
        id: qs.id,
        indentStyle: `paddingLeft: ${lvl * 4}px`,
        noChildren: qs.data.length === 0,
        children: [],
        operator: this.mapOperator(qs.operator)
      }
      this._queryRows.push(grp)
      qs.data.forEach((r, idx) => {
        this.parseQuery2(r, ++lvl, grp)
      })
    } else {
      grp.children.push({
        id: qs.id,
        indentStyle: `paddingLeft: ${lvl * 6}px`,
        trait: qs.trait
      })
    }
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
          'padding-left': `${lvl * 6}px`
        }
        
        // Each child begins on a new line - indented from parent
        s += `<div class='rule-style' style="${this.mapStyle(ruleStyle)}">`
        
        // Parse the child, w/ new level
        s +=  this.parseQuery(r, lvl)

        // Separate any children with Group Operator
        // Note: Operator omitted if only one child exists
        if (idx < qs.data.length - 1) {
          s += ` <b style="color:${this.colors.operator}">${this.mapOperator(qs.operator)}</b> `
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
        s += `<span style='font-weight:600'>${qs.trait.ALIAS}</span>`

        // Output Operator or missing operator text if not present
        s += this.mapOperator(qs.operator)
          ? ` <span style="">${this.mapOperator(qs.operator)}</span> `
          : ` <span style="color:${this.colors.err}"><missing operator></span> `
        
        // IN/NOT IN operators have values surrounded by parens
        let isInClause = qs.operator && qs.operator.indexOf('IN') !== -1
        if (isInClause) s += '('

        // Output Selected Values
        if (qs.value) {

          // Comma separate each selected value
          // Note: comma omitted if only a single value is selected
          s+= '<span style="font-weight:600">' + qs.value.map((v, i) => {
            const rv = v.split('^')
            return rv[0]
          }).join(', ') + '</span>'
        } else {
          // No values present - output missing values text
          s += ` <span style="color:${this.colors.err}"><missing value></span> `
        }

        // end paren for IN/NOT IN Operators
        if (isInClause) s += ')'
      } else {
        // Missing trait - output missing trait text
        s += ` <span style="color:${this.err}"><missing trait></span> `
      }
    }
    return s
  }*/
}